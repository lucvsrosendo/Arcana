import type { LanguageCode, ReadingSlot, SpreadDefinition } from "../types/tarot";

export type CardInsightPayload = {
  language: LanguageCode;
  question: string;
  spread: {
    id: string;
    title: string;
    description: string;
  };
  position: {
    title: string;
    prompt: string;
  };
  card: {
    name: string;
    number: number;
    reversed?: boolean;
    description: string;
    dailyAdvice?: string;
    meanings: ReadingSlot["card"]["meanings"];
    positiveKeywords: string[];
    cautionKeywords: string[];
  };
  revealedSoFar?: Array<{
    position: string;
    cardName: string;
    reversed?: boolean;
  }>;
};

export type SlotInsightState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; text: string; fromFallback?: boolean }
  | { status: "error"; message: string; fallbackText: string };

export const buildCardInsightPayload = (
  language: LanguageCode,
  question: string,
  spread: SpreadDefinition,
  slot: ReadingSlot,
  revealedSlots: ReadingSlot[],
): CardInsightPayload => ({
  language,
  question: question.trim(),
  spread: {
    id: spread.id,
    title: spread.title,
    description: spread.description,
  },
  position: {
    title: slot.position.title,
    prompt: slot.position.prompt,
  },
  card: {
    name: slot.card.name,
    number: slot.card.number,
    reversed: slot.reversed,
    description: slot.card.description,
    dailyAdvice: slot.card.dailyAdvice,
    meanings: slot.card.meanings,
    positiveKeywords: slot.card.positiveKeywords,
    cautionKeywords: slot.card.cautionKeywords,
  },
  revealedSoFar: revealedSlots
    .filter((entry) => entry.id !== slot.id)
    .map((entry) => ({
      position: entry.position.title,
      cardName: entry.card.name,
      reversed: entry.reversed,
    })),
});

export const getCardInsightFallbackText = (slot: ReadingSlot) =>
  slot.card.dailyAdvice?.trim() ||
  slot.card.description?.trim() ||
  (slot.reversed ? slot.card.meanings.shadow : slot.card.meanings.general);

export const buildCardInsightCacheKey = (
  question: string,
  slot: ReadingSlot,
) =>
  [
    question.trim().toLowerCase(),
    slot.id,
    slot.card.id,
    slot.reversed ? "reversed" : "upright",
  ].join("|");
