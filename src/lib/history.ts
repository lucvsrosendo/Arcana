import { cardCombinations } from "../data/combinations";
import { getLocalizedSpreadDefinition, localizeCard, localizeCombination } from "../data/i18n";
import type {
  LanguageCode,
  ReadingRecord,
  ReadingSlot,
  SpreadId,
  TarotCardId,
} from "../types/tarot";

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const findSpecialCombinations = (
  reading: readonly ReadingSlot[],
  language: LanguageCode = "pt",
) => {
  const cardIds = new Set(reading.map((slot) => slot.card.id));

  return cardCombinations
    .filter((combination) =>
      combination.cards.every((cardId: TarotCardId) => cardIds.has(cardId)),
    )
    .map((combination) => localizeCombination(combination, language));
};

export const createReadingRecord = (
  reading: readonly ReadingSlot[],
  spreadId: SpreadId,
  id = createId(),
  language: LanguageCode = "pt",
  question?: string,
): ReadingRecord => {
  const spread = getLocalizedSpreadDefinition(spreadId, language);

  return {
    id,
    spreadId,
    spreadTitle: spread.title,
    createdAt: new Date().toISOString(),
    question,
    combinations: findSpecialCombinations(reading, language),
    cards: reading.map((slot, index) => ({
      position: spread.positions[index]?.title ?? slot.position.title,
      cardId: slot.card.id,
      cardName: localizeCard(slot.card, language).name,
      number: slot.card.number,
      reversed: slot.reversed ?? false,
    })),
  };
};

export const createJournalId = createId;
