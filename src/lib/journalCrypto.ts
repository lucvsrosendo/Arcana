const JOURNAL_ENCRYPTED_KEY = "tarot:journal:encrypted";
const JOURNAL_SALT_KEY = "tarot:journal:salt";
const JOURNAL_PASSPHRASE_KEY = "tarot:journal:passphrase";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => {
  // Avoid spread on large Uint8Arrays (can throw Maximum call stack size exceeded).
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
};

const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

const ensureSalt = () => {
  const existing = localStorage.getItem(JOURNAL_SALT_KEY);
  if (existing) {
    return fromBase64(existing);
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  localStorage.setItem(JOURNAL_SALT_KEY, toBase64(salt));
  return salt;
};

const deriveKey = async (passphrase: string) => {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: ensureSalt(),
      iterations: 120000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
};

const encryptTextWithPassphrase = async (plainText: string, passphrase: string) => {
  const key = await deriveKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(plainText),
  );
  return JSON.stringify({
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted)),
  });
};

const decryptTextWithPassphrase = async (payload: string, passphrase: string) => {
  const packed = JSON.parse(payload) as { iv: string; data: string };
  const key = await deriveKey(passphrase);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(packed.iv) },
    key,
    fromBase64(packed.data),
  );
  return textDecoder.decode(decrypted);
};

export const encryptCloudJournalText = async (text: string, passphrase: string) =>
  `enc:${await encryptTextWithPassphrase(text, passphrase)}`;

export const decryptCloudJournalText = async (text: string, passphrase: string) => {
  if (!text.startsWith("enc:")) {
    return text;
  }
  return decryptTextWithPassphrase(text.slice(4), passphrase);
};

export const getJournalPassphrase = () => {
  const sessionValue = sessionStorage.getItem(JOURNAL_PASSPHRASE_KEY);
  if (sessionValue) {
    return sessionValue;
  }

  const legacyValue = localStorage.getItem(JOURNAL_PASSPHRASE_KEY);
  if (legacyValue) {
    sessionStorage.setItem(JOURNAL_PASSPHRASE_KEY, legacyValue);
    localStorage.removeItem(JOURNAL_PASSPHRASE_KEY);
    return legacyValue;
  }

  return null;
};

export const setJournalPassphrase = (passphrase: string) => {
  sessionStorage.setItem(JOURNAL_PASSPHRASE_KEY, passphrase);
  localStorage.removeItem(JOURNAL_PASSPHRASE_KEY);
};

export const encryptJournal = async (journal: unknown, passphrase: string) => {
  const key = await deriveKey(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const payload = textEncoder.encode(JSON.stringify(journal));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    payload,
  );

  const packed = {
    iv: toBase64(iv),
    data: toBase64(new Uint8Array(encrypted)),
  };

  localStorage.setItem(JOURNAL_ENCRYPTED_KEY, JSON.stringify(packed));
};

export const decryptJournal = async <T>(passphrase: string): Promise<T | null> => {
  const raw = localStorage.getItem(JOURNAL_ENCRYPTED_KEY);
  if (!raw) {
    return null;
  }

  const packed = JSON.parse(raw) as { iv: string; data: string };
  const key = await deriveKey(passphrase);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromBase64(packed.iv) },
    key,
    fromBase64(packed.data),
  );

  return JSON.parse(textDecoder.decode(decrypted)) as T;
};

export const clearEncryptedJournal = () => {
  localStorage.removeItem(JOURNAL_ENCRYPTED_KEY);
};
