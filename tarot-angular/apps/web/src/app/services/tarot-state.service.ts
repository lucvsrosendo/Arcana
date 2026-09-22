import { Injectable, computed, signal } from "@angular/core";
import {
  createReadingFromSpread,
  createReadingRecord,
  getDailyCard,
  getSpreadDefinition,
  majorArcana,
  shuffleDeck,
  type JournalEntry,
  type LanguageCode,
  type ReadingRecord,
  type ReadingSlot,
  type SpreadId,
  type TarotCard,
  type TarotCardId,
  type ThemeId,
} from "@tarot/core";

const HISTORY_KEY = "tarot:history";
const JOURNAL_KEY = "tarot:journal";
const THEME_KEY = "tarot:theme";
const LANGUAGE_KEY = "tarot:language";
const LEARNING_KEY = "tarot:learning";
const DAILY_STREAK_KEY = "tarot:daily-streak";
const REVERSALS_KEY = "tarot:reversals";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const readStorage = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
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

@Injectable({ providedIn: "root" })
export class TarotStateService {
  private readonly initialSpreadId: SpreadId = "three-card";
  private readonly initialDeck = shuffleDeck(majorArcana);
  private readonly initialReversals = readStorage<boolean>(REVERSALS_KEY, false);
  private readonly initialStreak = readStorage<{ count: number; lastDate: string | null }>(
    DAILY_STREAK_KEY,
    { count: 0, lastDate: null },
  );

  readonly deck = signal<TarotCard[]>(this.initialDeck);
  readonly spreadId = signal<SpreadId>(this.initialSpreadId);
  readonly reading = signal<ReadingSlot[]>(
    createReadingFromSpread(getSpreadDefinition(this.initialSpreadId), this.initialDeck, {
      enableReversals: this.initialReversals,
    }),
  );
  readonly revealedSlotIds = signal<string[]>([]);
  readonly isShuffling = signal(false);
  readonly history = signal<ReadingRecord[]>(readStorage<ReadingRecord[]>(HISTORY_KEY, []));
  readonly journal = signal<JournalEntry[]>(readStorage<JournalEntry[]>(JOURNAL_KEY, []));
  readonly dailyCard = signal<TarotCard>(getDailyCard());
  readonly themeId = signal<ThemeId>(readStorage<ThemeId>(THEME_KEY, "classic"));
  readonly language = signal<LanguageCode>(readStorage<LanguageCode>(LANGUAGE_KEY, "pt"));
  readonly learningMode = signal(readStorage<boolean>(LEARNING_KEY, false));
  readonly reversalsMode = signal(this.initialReversals);
  readonly readingQuestion = signal("");
  readonly dailyStreak = signal(this.initialStreak.count);
  readonly dailyStreakLastDate = signal<string | null>(this.initialStreak.lastDate);
  readonly currentReadingSaved = signal(false);

  readonly revealedCount = computed(() => this.revealedSlotIds().length);
  readonly totalSlots = computed(() => this.reading().length);
  readonly isComplete = computed(
    () => this.revealedCount() > 0 && this.revealedCount() === this.totalSlots(),
  );

  constructor() {
    this.applyTheme(this.themeId());
  }

  drawReading(spreadId: SpreadId = this.spreadId()) {
    const deck = shuffleDeck(majorArcana);
    this.deck.set(deck);
    this.spreadId.set(spreadId);
    this.reading.set(
      createReadingFromSpread(getSpreadDefinition(spreadId), deck, {
        enableReversals: this.reversalsMode(),
      }),
    );
    this.revealedSlotIds.set([]);
    this.currentReadingSaved.set(false);
  }

  revealCard(slotId: string) {
    if (this.revealedSlotIds().includes(slotId)) {
      return;
    }

    this.revealedSlotIds.update((ids) => [...ids, slotId]);
  }

  revealAll() {
    this.revealedSlotIds.set(this.reading().map((slot) => slot.id));
  }

  resetReading() {
    this.revealedSlotIds.set([]);
    this.readingQuestion.set("");
    this.currentReadingSaved.set(false);
  }

  saveCurrentReading(): ReadingRecord | undefined {
    if (this.revealedSlotIds().length === 0 || this.currentReadingSaved()) {
      return undefined;
    }

    const record = createReadingRecord(
      this.reading().filter((slot) => this.revealedSlotIds().includes(slot.id)),
      this.spreadId(),
      createId(),
      this.language(),
      this.readingQuestion().trim() || undefined,
    );

    this.history.update((items) => [record, ...items].slice(0, 120));
    writeStorage(HISTORY_KEY, this.history());
    this.currentReadingSaved.set(true);
    return record;
  }

  addJournalEntry(entry: Omit<JournalEntry, "id" | "createdAt">) {
    const next: JournalEntry = {
      ...entry,
      id: createId(),
      createdAt: new Date().toISOString(),
    };

    this.journal.update((items) => [next, ...items]);
    writeStorage(JOURNAL_KEY, this.journal());
    return next;
  }

  setLanguage(language: LanguageCode) {
    this.language.set(language);
    writeStorage(LANGUAGE_KEY, language);
  }

  setTheme(themeId: ThemeId) {
    this.themeId.set(themeId);
    writeStorage(THEME_KEY, themeId);
    this.applyTheme(themeId);
  }

  toggleLearningMode() {
    this.learningMode.update((value) => !value);
    writeStorage(LEARNING_KEY, this.learningMode());
  }

  toggleReversalsMode() {
    this.reversalsMode.update((value) => !value);
    writeStorage(REVERSALS_KEY, this.reversalsMode());
  }

  registerDailyVisit() {
    const today = getLocalDateKey();
    const lastDate = this.dailyStreakLastDate();

    if (lastDate === today) {
      return;
    }

    const nextCount =
      lastDate && getPreviousDateKey(today) === lastDate ? this.dailyStreak() + 1 : 1;

    this.setDailyStreak(nextCount, today);
  }

  setDailyStreak(count: number, lastDate: string | null) {
    this.dailyStreak.set(count);
    this.dailyStreakLastDate.set(lastDate);
    writeStorage(DAILY_STREAK_KEY, { count, lastDate });
  }

  private applyTheme(themeId: ThemeId) {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.dataset["theme"] = themeId;
  }
}
