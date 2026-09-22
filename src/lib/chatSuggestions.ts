import type { TarotChatContext } from "./chatContext";
import type { ReadingSlot } from "../types/tarot";

export const buildDynamicSuggestions = (
  context: TarotChatContext,
  reading: readonly ReadingSlot[],
  revealedSlotIds: readonly string[],
  copy: Record<string, string>,
): string[] => {
  const suggestions: string[] = [];

  if (context.question?.trim()) {
    suggestions.push(copy.chatSuggestionAnswerQuestion);
  }

  const lastRevealed = context.cards[context.cards.length - 1];
  const hasHidden = revealedSlotIds.length < reading.length;

  if (hasHidden && lastRevealed) {
    suggestions.push(
      copy.chatSuggestionPosition
        .replace("{card}", lastRevealed.cardName)
        .replace("{position}", lastRevealed.position),
    );
  }

  if (context.combinations?.length) {
    suggestions.push(
      copy.chatSuggestionCombination.replace("{name}", context.combinations[0].name),
    );
  }

  suggestions.push(
    copy.chatSuggestionQabalah,
    copy.chatSuggestionRitual,
    copy.chatSuggestionReading,
    copy.chatSuggestionLove,
    copy.chatSuggestionAdvice,
  );

  return [...new Set(suggestions)].slice(0, 7);
};
