export type StorageAdapter = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

const JOURNAL_ENCRYPTED_KEY = "tarot:journal:encrypted";
const JOURNAL_SALT_KEY = "tarot:journal:salt";
const JOURNAL_PASSPHRASE_KEY = "tarot:journal:passphrase";

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const toBase64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const fromBase64 = (value: string) =>
  Uint8Array.from(atob(value), (char) => char.charCodeAt(0));

export const createJournalCrypto = (storage: StorageAdapter) => {
  const ensureSalt = () => {
    const existing = storage.getItem(JOURNAL_SALT_KEY);
    if (existing) {
      return fromBase64(existing);
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    storage.setItem(JOURNAL_SALT_KEY, toBase64(salt));
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
        iterations: 120_000,
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

  return {
    encryptCloudJournalText: async (text: string, passphrase: string) =>
      `enc:${await encryptTextWithPassphrase(text, passphrase)}`,
    decryptCloudJournalText: async (text: string, passphrase: string) => {
      if (!text.startsWith("enc:")) {
        return text;
      }
      return decryptTextWithPassphrase(text.slice(4), passphrase);
    },
    getJournalPassphrase: () => storage.getItem(JOURNAL_PASSPHRASE_KEY),
    setJournalPassphrase: (passphrase: string) => {
      storage.setItem(JOURNAL_PASSPHRASE_KEY, passphrase);
    },
    encryptJournal: async (journal: unknown, passphrase: string) => {
      const key = await deriveKey(passphrase);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const payload = textEncoder.encode(JSON.stringify(journal));
      const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);
      storage.setItem(
        JOURNAL_ENCRYPTED_KEY,
        JSON.stringify({
          iv: toBase64(iv),
          data: toBase64(new Uint8Array(encrypted)),
        }),
      );
    },
    decryptJournal: async <T>(passphrase: string): Promise<T | null> => {
      const raw = storage.getItem(JOURNAL_ENCRYPTED_KEY);
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
    },
    clearEncryptedJournal: () => {
      storage.removeItem(JOURNAL_ENCRYPTED_KEY);
    },
  };
};

export const browserJournalCrypto = () => {
  if (typeof localStorage === "undefined") {
    throw new Error("localStorage is not available.");
  }

  return createJournalCrypto(localStorage);
};
