import { create } from "zustand";
import { majorArcana } from "../data/majorArcana";
import { getSpreadDefinition } from "../data/spreads";
import { createReadingRecord } from "../lib/history";
import { createReadingFromSpread, getDailyCard } from "../lib/readings";
import { readStorage, writeStorage } from "../lib/storage";
import {
  SHUFFLE_REDUCED_MS,
  SHUFFLE_SEQUENCE_MS,
} from "../features/tarot/shuffleTiming";
import { shuffleDeck } from "../lib/shuffleDeck";
import type {
  JournalEntry,
  LanguageCode,
  ReadingRecord,
  ReadingSlot,
  SpreadId,
  TarotCard,
  TarotCardId,
  ThemeId,
} from "../types/tarot";

const HISTORY_KEY = "tarot:history";
const JOURNAL_KEY = "tarot:journal";
const THEME_KEY = "tarot:theme";
const LANGUAGE_KEY = "tarot:language";
const LEARNING_KEY = "tarot:learning";
const DAILY_STREAK_KEY = "tarot:daily-streak";
const REVERSALS_KEY = "tarot:reversals";
const SOUND_KEY = "tarot:sound";
const FAVORITES_KEY = "tarot:favorites";

type DrawReadingOptions = {
  preserveQuestion?: boolean;
};

let drawReadingTimer: number | undefined;
let pendingShuffleDeck: TarotCard[] | null = null;
let pendingShuffleSpreadId: SpreadId | null = null;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const getShuffleSafetyMs = () =>
  prefersReducedMotion() ? SHUFFLE_REDUCED_MS + 120 : SHUFFLE_SEQUENCE_MS + 240;

const persistLocalJournal = (journal: JournalEntry[]) => {
  void import("../lib/journalCrypto")
    .then(async (module) => {
      const passphrase = module.getJournalPassphrase();
      if (passphrase) {
        localStorage.removeItem(JOURNAL_KEY);
        await module.encryptJournal(journal, passphrase);
        return;
      }
      writeStorage(JOURNAL_KEY, journal);
    })
    .catch((error: unknown) => console.error(error));
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPreviousDateKey = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return getLocalDateKey(date);
};

type TarotState = {
  deck: TarotCard[];
  reading: ReadingSlot[];
  spreadId: SpreadId;
  revealedSlotIds: string[];
  selectedDeckCardIds: TarotCardId[];
  isShuffling: boolean;
  history: ReadingRecord[];
  journal: JournalEntry[];
  dailyCard: TarotCard;
  themeId: ThemeId;
  language: LanguageCode;
  soundEnabled: boolean;
  learningMode: boolean;
  reversalsMode: boolean;
  readingQuestion: string;
  favorites: TarotCardId[];
  dailyStreak: number;
  dailyStreakLastDate: string | null;
  isAccountStorageActive: boolean;
  currentReadingSaved: boolean;
  syncError: string | null;
  beginAccountSession: () => void;
  setAccountData: (history: ReadingRecord[], journal: JournalEntry[]) => void;
  restoreLocalData: () => void;
  hydrateEncryptedJournal: () => Promise<void>;
  drawReading: (spreadId?: SpreadId, options?: DrawReadingOptions) => void;
  finishShuffle: () => void;
  setSpread: (spreadId: SpreadId) => void;
  chooseDeckCard: (cardId: TarotCardId) => void;
  revealCard: (slotId: string) => void;
  revealAll: () => void;
  resetReading: () => void;
  saveCurrentReading: () => ReadingRecord | undefined;
  clearHistory: () => void;
  clearJournal: () => void;
  addJournalEntry: (entry: Omit<JournalEntry, "id" | "createdAt">) => void;
  updateJournalEntry: (
    entryId: string,
    updates: Omit<JournalEntry, "id" | "createdAt">,
  ) => void;
  deleteJournalEntry: (entryId: string) => void;
  setTheme: (themeId: ThemeId) => void;
  setLanguage: (language: LanguageCode) => void;
  toggleSound: () => void;
  toggleLearningMode: () => void;
  toggleReversalsMode: () => void;
  setReadingQuestion: (question: string) => void;
  toggleFavorite: (cardId: TarotCardId) => void;
  registerDailyVisit: () => void;
  clearSyncError: () => void;
};

const initialSpreadId: SpreadId = "three-card";
const initialDeck = shuffleDeck(majorArcana);
const initialReversalsMode = readStorage<boolean>(REVERSALS_KEY, false);
const initialDailyStreak = readStorage<{ count: number; lastDate: string | null }>(
  DAILY_STREAK_KEY,
  {
    count: 0,
    lastDate: null,
  },
);

export const useTarot = create<TarotState>((set, get) => ({
  deck: initialDeck,
  reading: createReadingFromSpread(getSpreadDefinition(initialSpreadId), initialDeck, {
    enableReversals: initialReversalsMode,
  }),
  spreadId: initialSpreadId,
  revealedSlotIds: [],
  selectedDeckCardIds: [],
  isShuffling: false,
  history: readStorage<ReadingRecord[]>(HISTORY_KEY, []),
  journal: readStorage<JournalEntry[]>(JOURNAL_KEY, []),
  dailyCard: getDailyCard(),
  themeId: readStorage<ThemeId>(THEME_KEY, "classic"),
  language: readStorage<LanguageCode>(LANGUAGE_KEY, "pt"),
  soundEnabled: readStorage<boolean>(SOUND_KEY, false),
  learningMode: readStorage<boolean>(LEARNING_KEY, false),
  reversalsMode: initialReversalsMode,
  readingQuestion: "",
  favorites: readStorage<TarotCardId[]>(FAVORITES_KEY, []),
  dailyStreak: initialDailyStreak.count,
  dailyStreakLastDate: initialDailyStreak.lastDate,
  isAccountStorageActive: false,
  currentReadingSaved: false,
  syncError: null,

  beginAccountSession: () => {
    set({ isAccountStorageActive: true, syncError: null });
  },

  setAccountData: (history, journal) => {
    set({
      history,
      journal,
      isAccountStorageActive: true,
      syncError: null,
    });
    writeStorage(HISTORY_KEY, []);
    try {
      localStorage.removeItem(JOURNAL_KEY);
    } catch {
      // ignore
    }
  },

  restoreLocalData: () => {
    set({
      history: readStorage<ReadingRecord[]>(HISTORY_KEY, []),
      journal: readStorage<JournalEntry[]>(JOURNAL_KEY, []),
      isAccountStorageActive: false,
      syncError: null,
    });
  },

  hydrateEncryptedJournal: async () => {
    try {
      const { getJournalPassphrase, decryptJournal } = await import(
        "../lib/journalCrypto"
      );
      const passphrase = getJournalPassphrase();
      if (!passphrase) {
        return;
      }

      const encryptedJournal = await decryptJournal<JournalEntry[]>(passphrase);
      if (encryptedJournal) {
        set({ journal: encryptedJournal });
      }
    } catch (error) {
      console.error(error);
    }
  },

  drawReading: (nextSpreadId, options) => {
    const spreadId = nextSpreadId ?? get().spreadId;

    if (drawReadingTimer !== undefined) {
      window.clearTimeout(drawReadingTimer);
    }

    pendingShuffleDeck = shuffleDeck(majorArcana);
    pendingShuffleSpreadId = spreadId;

    set({
      spreadId,
      isShuffling: true,
      revealedSlotIds: [],
      selectedDeckCardIds: [],
      currentReadingSaved: false,
      ...(options?.preserveQuestion ? {} : { readingQuestion: "" }),
    });

    drawReadingTimer = window.setTimeout(() => {
      get().finishShuffle();
    }, getShuffleSafetyMs());
  },

  finishShuffle: () => {
    const state = get();

    if (!state.isShuffling) {
      return;
    }

    if (drawReadingTimer !== undefined) {
      window.clearTimeout(drawReadingTimer);
      drawReadingTimer = undefined;
    }

    const spreadId = pendingShuffleSpreadId ?? state.spreadId;
    const spread = getSpreadDefinition(spreadId);
    const nextDeck = pendingShuffleDeck ?? shuffleDeck(majorArcana);

    pendingShuffleDeck = null;
    pendingShuffleSpreadId = null;

    set({
      spreadId,
      deck: nextDeck,
      reading: createReadingFromSpread(spread, nextDeck, {
        enableReversals: state.reversalsMode,
      }),
      revealedSlotIds: [],
      selectedDeckCardIds: [],
      isShuffling: false,
    });
  },

  setSpread: (spreadId) => {
    get().drawReading(spreadId);
  },

  chooseDeckCard: (cardId) => {
    const state = get();

    if (
      state.isShuffling ||
      state.selectedDeckCardIds.includes(cardId) ||
      state.revealedSlotIds.length >= state.reading.length
    ) {
      return;
    }

    const nextSlotIndex = state.revealedSlotIds.length;
    const nextSlot = state.reading[nextSlotIndex];
    const chosenCard = state.deck.find((card) => card.id === cardId);

    if (!nextSlot || !chosenCard) {
      return;
    }

    const reversed = state.reversalsMode ? Math.random() < 0.5 : false;
    const reading = state.reading.map((slot, index) =>
      index === nextSlotIndex ? { ...slot, card: chosenCard, reversed } : slot,
    );
    const revealedSlotIds = [...state.revealedSlotIds, nextSlot.id];
    const selectedDeckCardIds = [...state.selectedDeckCardIds, cardId];
    const allRevealed = revealedSlotIds.length === reading.length;

    set({
      reading,
      revealedSlotIds,
      selectedDeckCardIds,
    });

    if (allRevealed) {
      window.setTimeout(() => get().saveCurrentReading(), 350);
    }
  },

  revealCard: (slotId) => {
    const state = get();

    if (state.revealedSlotIds.includes(slotId) || state.isShuffling) {
      return;
    }

    const revealedSlotIds = [...state.revealedSlotIds, slotId];
    const allRevealed = revealedSlotIds.length === state.reading.length;

    set({ revealedSlotIds });

    if (allRevealed) {
      window.setTimeout(() => get().saveCurrentReading(), 350);
    }
  },

  revealAll: () => {
    const state = get();

    if (state.isShuffling) {
      return;
    }

    const reading = state.reading.map((slot, index) => ({
      ...slot,
      card: state.deck[index] ?? slot.card,
    }));

    set({
      reading,
      revealedSlotIds: reading.map((slot) => slot.id),
      selectedDeckCardIds: reading.map((slot) => slot.card.id),
    });

    window.setTimeout(() => get().saveCurrentReading(), 350);
  },

  resetReading: () => {
    const state = get();
    set({
      reading: createReadingFromSpread(getSpreadDefinition(state.spreadId), state.deck, {
        enableReversals: state.reversalsMode,
      }),
      revealedSlotIds: [],
      selectedDeckCardIds: [],
      currentReadingSaved: false,
      readingQuestion: "",
    });
  },

  saveCurrentReading: () => {
    const state = get();

    if (
      state.currentReadingSaved ||
      state.revealedSlotIds.length !== state.reading.length
    ) {
      return undefined;
    }

    const record = createReadingRecord(
      state.reading,
      state.spreadId,
      undefined,
      state.language,
      state.readingQuestion.trim() || undefined,
    );
    const history = [record, ...state.history].slice(0, 80);

    if (state.isAccountStorageActive) {
      void import("../lib/tarotCloud")
        .then((module) => module.saveReadingToCloud(record))
        .catch((error: unknown) => {
          console.error(error);
          set({ syncError: "cloud-sync-error" });
        });
    } else {
      writeStorage(HISTORY_KEY, history);
    }

    set({
      history,
      currentReadingSaved: true,
      syncError: null,
    });

    return record;
  },

  clearHistory: () => {
    if (get().isAccountStorageActive) {
      void import("../lib/tarotCloud")
        .then((module) => module.clearReadingsFromCloud())
        .catch((error: unknown) => {
          console.error(error);
          set({ syncError: "cloud-sync-error" });
        });
    } else {
      writeStorage(HISTORY_KEY, []);
    }

    set({ history: [], syncError: null });
  },

  clearJournal: () => {
    if (get().isAccountStorageActive) {
      void import("../lib/tarotCloud")
        .then((module) => module.clearJournalEntriesFromCloud())
        .catch((error: unknown) => {
          console.error(error);
          set({ syncError: "cloud-sync-error" });
        });
    } else {
      persistLocalJournal([]);
    }

    set({ journal: [], syncError: null });
  },

  addJournalEntry: (entry) => {
    const journalEntry: JournalEntry = {
      ...entry,
      id: createId(),
      createdAt: new Date().toISOString(),
    };
    const journal = [journalEntry, ...get().journal];

    if (get().isAccountStorageActive) {
      void import("../lib/tarotCloud")
        .then((module) => module.saveJournalEntryToCloud(journalEntry))
        .then(async ({ awardedXp }) => {
          if (!awardedXp || awardedXp <= 0) {
            return;
          }
          const { emitXpGain } = await import("../lib/xpSignals");
          emitXpGain(awardedXp);
        })
        .catch((error: unknown) => {
          console.error(error);
          set({ syncError: "cloud-sync-error" });
        });
    } else {
      persistLocalJournal(journal);
    }

    set({ journal, syncError: null });
  },

  updateJournalEntry: (entryId, updates) => {
    const existingEntry = get().journal.find((entry) => entry.id === entryId);

    if (!existingEntry) {
      return;
    }

    const updatedEntry: JournalEntry = {
      ...existingEntry,
      ...updates,
    };
    const journal = get().journal.map((entry) =>
      entry.id === entryId ? updatedEntry : entry,
    );

    if (get().isAccountStorageActive) {
      void import("../lib/tarotCloud")
        .then((module) => module.saveJournalEntryToCloud(updatedEntry))
        .then(async ({ awardedXp }) => {
          // Backfill XP for entries saved before the journal trigger/RPC existed.
          if (!awardedXp || awardedXp <= 0) {
            return;
          }

          const { emitXpGain } = await import("../lib/xpSignals");
          emitXpGain(awardedXp);
        })
        .catch((error: unknown) => {
          console.error(error);
          set({ syncError: "cloud-sync-error" });
        });
    } else {
      persistLocalJournal(journal);
    }

    set({ journal, syncError: null });
  },

  deleteJournalEntry: (entryId) => {
    const journal = get().journal.filter((entry) => entry.id !== entryId);

    if (get().isAccountStorageActive) {
      void import("../lib/tarotCloud")
        .then((module) => module.deleteJournalEntryFromCloud(entryId))
        .catch((error: unknown) => {
          console.error(error);
          set({ syncError: "cloud-sync-error" });
        });
    } else {
      persistLocalJournal(journal);
    }

    set({ journal, syncError: null });
  },

  setTheme: (themeId) => {
    writeStorage(THEME_KEY, themeId);
    set({ themeId });
  },

  setLanguage: (language) => {
    writeStorage(LANGUAGE_KEY, language);
    set({ language });
  },

  toggleSound: () => {
    const soundEnabled = !get().soundEnabled;
    writeStorage(SOUND_KEY, soundEnabled);
    set({ soundEnabled });
  },

  toggleLearningMode: () => {
    const learningMode = !get().learningMode;
    writeStorage(LEARNING_KEY, learningMode);
    set({ learningMode });
  },

  toggleReversalsMode: () => {
    const reversalsMode = !get().reversalsMode;
    writeStorage(REVERSALS_KEY, reversalsMode);
    set({ reversalsMode });
  },

  setReadingQuestion: (readingQuestion) => {
    set({ readingQuestion, currentReadingSaved: false });
  },

  toggleFavorite: (cardId) => {
    const favorites = get().favorites.includes(cardId)
      ? get().favorites.filter((id) => id !== cardId)
      : [...get().favorites, cardId];
    writeStorage(FAVORITES_KEY, favorites);
    set({ favorites });
  },

  registerDailyVisit: () => {
    const state = get();
    const todayKey = getLocalDateKey();

    if (state.dailyStreakLastDate === todayKey) {
      return;
    }

    const isConsecutive =
      state.dailyStreakLastDate === getPreviousDateKey(todayKey);
    const nextStreak = isConsecutive ? state.dailyStreak + 1 : 1;
    const nextData = { count: nextStreak, lastDate: todayKey };

    writeStorage(DAILY_STREAK_KEY, nextData);
    set({
      dailyStreak: nextStreak,
      dailyStreakLastDate: todayKey,
    });
  },

  clearSyncError: () => {
    set({ syncError: null });
  },
}));
