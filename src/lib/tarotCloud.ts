import { supabase } from "./supabaseClient";
import type { JournalEntry, ReadingRecord } from "../types/tarot";

const CLOUD_READING_LIMIT = 80;
const CLOUD_JOURNAL_LIMIT = 120;

type ReadingRow = {
  id: string;
  spread_id: ReadingRecord["spreadId"];
  spread_title: string;
  created_at: string;
  question?: string | null;
  cards: ReadingRecord["cards"];
  combinations: string[];
};

type JournalRow = {
  id: string;
  title: string;
  content: string;
  manifestation?: string | null;
  tags?: string[] | null;
  created_at: string;
  linked_reading_id: string | null;
};

const getCurrentUserId = async () => {
  if (!supabase) {
    return undefined;
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error("No authenticated user.");
  }

  return data.user.id;
};

const isMissingColumnError = (
  error: { message?: string; code?: string } | null,
  column: string,
) => {
  const message = error?.message?.toLowerCase() ?? "";
  const normalizedColumn = column.toLowerCase();

  return (
    message.includes(`${normalizedColumn} does not exist`) ||
    message.includes(`.${normalizedColumn} does not exist`) ||
    message.includes(`'${normalizedColumn}' column`) ||
    message.includes(`"${normalizedColumn}" column`) ||
    (error?.code === "PGRST204" && message.includes(normalizedColumn))
  );
};

const isForeignKeyError = (error: { message?: string; code?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "23503" ||
    message.includes("foreign key") ||
    message.includes("violates foreign key")
  );
};

const fetchReadingsFromCloud = async () => {
  if (!supabase) {
    return { data: [] as ReadingRow[], error: null };
  }

  const selectAttempts = [
    "id, spread_id, spread_title, created_at, question, cards, combinations",
    "id, spread_id, spread_title, created_at, cards, combinations",
  ];

  let lastError: { message?: string } | null = null;

  for (const select of selectAttempts) {
    const result = await supabase
      .from("tarot_readings")
      .select(select)
      .order("created_at", { ascending: false })
      .limit(CLOUD_READING_LIMIT);

    if (!result.error) {
      return { data: (result.data ?? []) as unknown as ReadingRow[], error: null };
    }

    lastError = result.error;
    if (!isMissingColumnError(result.error, "question")) {
      break;
    }
  }

  return { data: null, error: lastError };
};

const fetchJournalFromCloud = async () => {
  if (!supabase) {
    return { data: [] as JournalRow[], error: null };
  }

  const selectAttempts = [
    "id, title, content, manifestation, tags, created_at, linked_reading_id",
    "id, title, content, manifestation, created_at, linked_reading_id",
    "id, title, content, created_at, linked_reading_id",
  ];

  let lastError: { message?: string } | null = null;

  for (const select of selectAttempts) {
    const result = await supabase
      .from("tarot_journal_entries")
      .select(select)
      .order("created_at", { ascending: false })
      .limit(CLOUD_JOURNAL_LIMIT);

    if (!result.error) {
      return { data: (result.data ?? []) as unknown as JournalRow[], error: null };
    }

    lastError = result.error;
    const missingManifestation = isMissingColumnError(result.error, "manifestation");
    const missingTags = isMissingColumnError(result.error, "tags");

    if (!missingManifestation && !missingTags) {
      break;
    }
  }

  return { data: null, error: lastError };
};

export const fetchCloudAccountData = async () => {
  if (!supabase) {
    return { history: [] as ReadingRecord[], journal: [] as JournalEntry[] };
  }

  const [readingsResult, journalResult] = await Promise.all([
    fetchReadingsFromCloud(),
    fetchJournalFromCloud(),
  ]);

  if (readingsResult.error) {
    throw readingsResult.error;
  }

  if (journalResult.error) {
    throw journalResult.error;
  }

  const history = ((readingsResult.data ?? []) as ReadingRow[]).map((row) => ({
      id: row.id,
      spreadId: row.spread_id,
      spreadTitle: row.spread_title,
      createdAt: row.created_at,
      question: row.question ?? undefined,
      cards: row.cards,
      combinations: row.combinations,
    }));
  const rawJournal = ((journalResult.data ?? []) as JournalRow[]).map((row) => ({
      id: row.id,
      title: row.title,
      content: row.content,
      manifestation: row.manifestation ?? undefined,
      tags: row.tags ?? [],
      createdAt: row.created_at,
      linkedReadingId: row.linked_reading_id ?? undefined,
    }));

  const passphrase = (await import("./journalCrypto")).getJournalPassphrase();
  if (!passphrase) {
    return { history, journal: rawJournal };
  }

  try {
    const { decryptCloudJournalText } = await import("./journalCrypto");
    const journal = await Promise.all(
      rawJournal.map(async (entry) => ({
        ...entry,
        content: await decryptCloudJournalText(entry.content, passphrase),
        manifestation: entry.manifestation
          ? await decryptCloudJournalText(entry.manifestation, passphrase)
          : undefined,
      })),
    );
    return { history, journal };
  } catch (error) {
    console.warn("Failed to decrypt cloud journal entries", error);
    // Never surface ciphertext (`enc:...`) as readable journal content.
    const journal = rawJournal.map((entry) => ({
      ...entry,
      content: entry.content.startsWith("enc:") ? "" : entry.content,
      manifestation:
        entry.manifestation?.startsWith("enc:") ? undefined : entry.manifestation,
    }));
    return { history, journal, journalDecryptFailed: true as const };
  }
};

const sortByCreatedAtDesc = <T extends { createdAt: string }>(items: T[]) =>
  [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

/** Upload local-only rows then return merged cloud+local account snapshot. */
export const mergeLocalIntoCloudAccount = async (
  cloud: { history: ReadingRecord[]; journal: JournalEntry[] },
  local: { history: ReadingRecord[]; journal: JournalEntry[] },
) => {
  const cloudHistoryIds = new Set(cloud.history.map((record) => record.id));
  const cloudJournalIds = new Set(cloud.journal.map((entry) => entry.id));

  const localOnlyHistory = local.history.filter((record) => !cloudHistoryIds.has(record.id));
  const localOnlyJournal = local.journal.filter((entry) => !cloudJournalIds.has(entry.id));

  for (const record of localOnlyHistory) {
    try {
      await saveReadingToCloud(record);
    } catch (error) {
      console.warn("Failed to upload local reading during merge", error);
    }
  }

  for (const entry of localOnlyJournal) {
    try {
      await saveJournalEntryToCloud(entry);
    } catch (error) {
      console.warn("Failed to upload local journal entry during merge", error);
    }
  }

  const history = sortByCreatedAtDesc([...localOnlyHistory, ...cloud.history]).slice(
    0,
    CLOUD_READING_LIMIT,
  );
  const journal = sortByCreatedAtDesc([...localOnlyJournal, ...cloud.journal]).slice(
    0,
    CLOUD_JOURNAL_LIMIT,
  );

  return { history, journal };
};

export const fetchXpEventPoints = async (
  eventType: string,
  sourceId: string,
): Promise<number> => {
  if (!supabase) {
    return 0;
  }

  const { data, error } = await supabase
    .from("user_xp_events")
    .select("points")
    .eq("event_type", eventType)
    .eq("source_id", sourceId)
    .maybeSingle();

  if (error || !data) {
    return 0;
  }

  return typeof data.points === "number" ? data.points : 0;
};

/** Retries briefly so DB triggers can finish writing the ledger row. */
export const fetchXpEventPointsWithRetry = async (
  eventType: string,
  sourceId: string,
  attempts = 3,
  delayMs = 200,
): Promise<number> => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const points = await fetchXpEventPoints(eventType, sourceId);
    if (points > 0) {
      return points;
    }
    if (attempt < attempts - 1) {
      await new Promise((resolve) => {
        window.setTimeout(resolve, delayMs);
      });
    }
  }
  return 0;
};

export const saveReadingToCloud = async (record: ReadingRecord) => {
  if (!supabase) {
    return { awardedXp: 0 };
  }

  const userId = await getCurrentUserId();

  const payload = {
    id: record.id,
    user_id: userId,
    spread_id: record.spreadId,
    spread_title: record.spreadTitle,
    created_at: record.createdAt,
    question: record.question ?? null,
    cards: record.cards,
    combinations: record.combinations,
  };

  const { error } = await supabase.from("tarot_readings").upsert(payload);

  if (error && isMissingColumnError(error, "question")) {
    const legacyPayload = { ...payload };
    delete (legacyPayload as { question?: string | null }).question;
    const retry = await supabase.from("tarot_readings").upsert(legacyPayload);

    if (retry.error) {
      throw retry.error;
    }

    return { awardedXp: 0 };
  }

  if (error) {
    throw error;
  }

  return { awardedXp: 0 };
};

export const clearReadingsFromCloud = async () => {
  if (!supabase) {
    return;
  }

  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("tarot_readings")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};

const isMissingRpcError = (error: { message?: string; code?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST202" ||
    error?.code === "PGRST205" ||
    message.includes("could not find the function") ||
    message.includes("claim_journal_entry_xp")
  );
};

/** Awards journal XP via RPC when triggers were missing; returns points awarded (0 if already claimed). */
export const claimJournalEntryXp = async (entryId: string): Promise<number | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("claim_journal_entry_xp", {
    p_entry_id: entryId,
  });

  if (error) {
    if (isMissingRpcError(error)) {
      return null;
    }

    console.warn("claim_journal_entry_xp failed", error);
    return null;
  }

  return typeof data === "number" ? data : Number(data) || 0;
};

export const saveJournalEntryToCloud = async (entry: JournalEntry) => {
  if (!supabase) {
    return { awardedXp: null as number | null };
  }

  const userId = await getCurrentUserId();

  const passphrase = (await import("./journalCrypto")).getJournalPassphrase();
  const encryptedContent =
    passphrase && entry.content
      ? await import("./journalCrypto").then((module) =>
          module.encryptCloudJournalText(entry.content, passphrase),
        )
      : entry.content;
  const encryptedManifestation =
    passphrase && entry.manifestation
      ? await import("./journalCrypto").then((module) =>
          module.encryptCloudJournalText(entry.manifestation as string, passphrase),
        )
      : entry.manifestation ?? null;

  type JournalUpsertPayload = {
    id: string;
    user_id: string | undefined;
    title: string;
    content: string;
    manifestation?: string | null;
    tags?: string[];
    created_at: string;
    linked_reading_id: string | null;
  };

  const payload: JournalUpsertPayload = {
    id: entry.id,
    user_id: userId,
    title: entry.title,
    content: encryptedContent,
    manifestation: encryptedManifestation,
    tags: entry.tags ?? [],
    created_at: entry.createdAt,
    linked_reading_id: entry.linkedReadingId ?? null,
  };

  let attempt = payload;
  let lastError: { message?: string; code?: string } | null = null;
  let saved = false;

  for (let i = 0; i < 4; i += 1) {
    const { error } = await supabase
      .from("tarot_journal_entries")
      .upsert(attempt, { onConflict: "id" });

    if (!error) {
      saved = true;
      break;
    }

    lastError = error;
    const nextAttempt = { ...attempt };
    let stripped = false;

    if (isMissingColumnError(error, "tags") && "tags" in nextAttempt) {
      delete nextAttempt.tags;
      stripped = true;
    }

    if (isMissingColumnError(error, "manifestation") && "manifestation" in nextAttempt) {
      delete nextAttempt.manifestation;
      stripped = true;
    }

    if (
      isForeignKeyError(error) &&
      nextAttempt.linked_reading_id != null
    ) {
      nextAttempt.linked_reading_id = null;
      stripped = true;
    }

    if (!stripped) {
      break;
    }

    attempt = nextAttempt;
  }

  if (!saved) {
    throw lastError ?? new Error("Failed to save journal entry.");
  }

  const awardedXp = await claimJournalEntryXp(entry.id);
  if (awardedXp && awardedXp > 0) {
    return { awardedXp };
  }

  // Trigger may have already written the ledger; claim returns 0 — still surface toast.
  const ledgerXp = await fetchXpEventPointsWithRetry("journal_entry", entry.id);
  return { awardedXp: ledgerXp > 0 ? ledgerXp : awardedXp };
};

export const deleteJournalEntryFromCloud = async (entryId: string) => {
  if (!supabase) {
    return;
  }

  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("tarot_journal_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};

export const clearJournalEntriesFromCloud = async () => {
  if (!supabase) {
    return;
  }

  const userId = await getCurrentUserId();

  const { error } = await supabase
    .from("tarot_journal_entries")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
};
