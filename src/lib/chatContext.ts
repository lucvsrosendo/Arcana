import { arcanaDetails } from "../data/arcanaDetails";
import { findSpecialCombinations } from "./history";
import type { LanguageCode, ReadingSlot, SpreadDefinition } from "../types/tarot";

export type TarotChatContext = {
  language: LanguageCode;
  source?: "tarot-reading" | "tarot-journal";
  question?: string;
  learningMode?: boolean;
  deepMode?: boolean;
  spread: {
    id: string;
    title: string;
    description: string;
  };
  focusedCard?: {
    position: string;
    cardName: string;
    number: number;
    reversed?: boolean;
  };
  cards: Array<{
    position: string;
    prompt: string;
    cardName: string;
    number: number;
    reversed?: boolean;
    description: string;
    meanings: ReadingSlot["card"]["meanings"];
    dailyAdvice?: string;
    positiveKeywords: string[];
    cautionKeywords: string[];
    symbols?: string[];
    correspondences?: {
      element: string;
      planetOrSign: string;
      hebrewLetter: string;
      path: string;
    };
    positionLearningNote?: string;
  }>;
  combinations?: Array<{
    name: string;
    description: string;
  }>;
  readingProgress?: {
    revealed: number;
    total: number;
    hiddenPositions: string[];
  };
  draftNote?: string;
  manifestation?: string;
};

export const buildTarotChatContext = (
  language: LanguageCode,
  spread: SpreadDefinition,
  reading: readonly ReadingSlot[],
  revealedSlotIds: readonly string[],
  focusedSlotId?: string | null,
  question?: string,
  learningMode = false,
): TarotChatContext => {
  const revealedReading = reading.filter((slot) => revealedSlotIds.includes(slot.id));
  const combinations =
    revealedReading.length > 0
      ? findSpecialCombinations(revealedReading, language).map((line) => {
          const separator = line.indexOf(": ");
          return {
            name: separator >= 0 ? line.slice(0, separator) : line,
            description: separator >= 0 ? line.slice(separator + 2) : line,
          };
        })
      : undefined;

  return {
    language,
    source: "tarot-reading",
    question: question?.trim() ? question.trim() : undefined,
    learningMode,
    spread: {
      id: spread.id,
      title: spread.title,
      description: spread.description,
    },
    focusedCard: (() => {
      const focusedSlot = reading.find(
        (slot) => slot.id === focusedSlotId && revealedSlotIds.includes(slot.id),
      );

      return focusedSlot
        ? {
            position: focusedSlot.position.title,
            cardName: focusedSlot.card.name,
            number: focusedSlot.card.number,
            reversed: focusedSlot.reversed ?? false,
          }
        : undefined;
    })(),
    cards: revealedReading.map((slot) => {
      const detail = arcanaDetails[slot.card.id];

      return {
        position: slot.position.title,
        prompt: slot.position.prompt,
        cardName: slot.card.name,
        number: slot.card.number,
        reversed: slot.reversed ?? false,
        description: slot.card.description,
        meanings: slot.card.meanings,
        dailyAdvice: slot.card.dailyAdvice,
        positiveKeywords: slot.card.positiveKeywords,
        cautionKeywords: slot.card.cautionKeywords,
        symbols: detail?.symbols[language]?.slice(0, 5),
        correspondences: detail
          ? {
              element: detail.correspondences.element[language],
              planetOrSign: detail.correspondences.planetOrSign,
              hebrewLetter: detail.correspondences.hebrewLetter,
              path: detail.correspondences.path,
            }
          : undefined,
        positionLearningNote: learningMode ? slot.position.learningNote : undefined,
      };
    }),
    combinations,
    readingProgress: {
      revealed: revealedSlotIds.length,
      total: reading.length,
      hiddenPositions: reading
        .filter((slot) => !revealedSlotIds.includes(slot.id))
        .map((slot) => slot.position.title),
    },
  };
};

export const buildJournalChatContext = (
  language: LanguageCode,
  spread: { id: string; title: string },
  cards: Array<{ position: string; cardName: string; number: number }>,
  draftNote: string,
  manifestation: string,
): TarotChatContext => ({
  language,
  source: "tarot-journal",
  spread: {
    id: spread.id,
    title: spread.title,
    description: "",
  },
  cards: cards.map((card) => ({
    position: card.position,
    prompt: card.position,
    cardName: card.cardName,
    number: card.number,
    reversed: false,
    description: "",
    meanings: {
      general: "",
      love: "",
      work: "",
      spirituality: "",
      shadow: "",
    },
    positiveKeywords: [],
    cautionKeywords: [],
  })),
  draftNote,
  manifestation,
  readingProgress: {
    revealed: cards.length,
    total: cards.length,
    hiddenPositions: [],
  },
});
