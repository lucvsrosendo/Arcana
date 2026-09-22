export type TarotCardId =
  | "the-fool"
  | "the-magician"
  | "the-high-priestess"
  | "the-empress"
  | "the-emperor"
  | "the-hierophant"
  | "the-lovers"
  | "the-chariot"
  | "strength"
  | "the-hermit"
  | "wheel-of-fortune"
  | "justice"
  | "the-hanged-man"
  | "death"
  | "temperance"
  | "the-devil"
  | "the-tower"
  | "the-star"
  | "the-moon"
  | "the-sun"
  | "judgement"
  | "the-world";

export type MeaningCategory =
  | "general"
  | "love"
  | "work"
  | "spirituality"
  | "shadow";

export type ArcanaArtwork = {
  symbol: string;
  motif: "circle" | "triangle" | "pillar" | "wave" | "sun" | "gate";
  palette: [string, string, string];
};

export type TarotCard = {
  id: TarotCardId;
  number: number;
  name: string;
  description: string;
  meanings: Record<MeaningCategory, string>;
  positiveKeywords: string[];
  cautionKeywords: string[];
  keywords: string[];
  dailyAdvice?: string;
  symbols?: string[];
  correspondences?: {
    element: string;
    planetOrSign: string;
    hebrewLetter: string;
    path: string;
  };
  artwork: ArcanaArtwork;
  image: string;
};

export type SpreadId =
  | "single"
  | "three-card"
  | "celtic-cross"
  | "daily-advice"
  | "hand-of-eris"
  | "yes-no"
  | "relationship"
  | "year-ahead";

export type ReadingPosition = {
  id: string;
  title: string;
  prompt: string;
  learningNote: string;
};

export type SpreadDefinition = {
  id: SpreadId;
  title: string;
  subtitle: string;
  description: string;
  positions: ReadingPosition[];
};

export type ReadingSlot = {
  id: string;
  position: ReadingPosition;
  card: TarotCard;
  reversed?: boolean;
};

export type ReadingCardSnapshot = {
  position: string;
  cardId: TarotCardId;
  cardName: string;
  number: number;
  reversed?: boolean;
};

export type ReadingRecord = {
  id: string;
  spreadId: SpreadId;
  spreadTitle: string;
  createdAt: string;
  question?: string;
  cards: ReadingCardSnapshot[];
  combinations: string[];
};

export type JournalEntry = {
  id: string;
  title: string;
  content: string;
  manifestation?: string;
  createdAt: string;
  linkedReadingId?: string;
  tags?: string[];
};

export type ThemeId =
  | "classic"
  | "lunar"
  | "golden"
  | "minimal"
  | "solar"
  | "forest"
  | "rose"
  | "abyss"
  | "aurora"
  | "ritual";

export type LanguageCode = "pt" | "en" | "es";

export type AppPage =
  | "home"
  | "reading"
  | "history"
  | "journal"
  | "arcana"
  | "learn"
  | "settings"
  | "news"
  | "news-admin"
  | "privacy"
  | "terms"
  | "cookies";
