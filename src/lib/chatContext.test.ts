import { describe, expect, it } from "vitest";
import { getLocalizedSpreadDefinition } from "../data/i18n";
import { majorArcana } from "../data/majorArcana";
import { buildTarotChatContext } from "./chatContext";
import { createReadingFromSpread } from "./readings";

describe("buildTarotChatContext", () => {
  const spread = getLocalizedSpreadDefinition("three-card", "pt");
  const reading = createReadingFromSpread(spread, majorArcana, {
    enableReversals: false,
  });
  const revealedSlotIds = [reading[0].id, reading[1].id];

  it("includes only revealed cards", () => {
    const context = buildTarotChatContext(
      "pt",
      spread,
      reading,
      revealedSlotIds,
      null,
      "Qual caminho seguir?",
    );

    expect(context.cards).toHaveLength(2);
    expect(context.readingProgress?.hiddenPositions).toHaveLength(1);
    expect(context.question).toBe("Qual caminho seguir?");
  });

  it("adds correspondences and symbols for revealed cards", () => {
    const context = buildTarotChatContext("pt", spread, reading, revealedSlotIds);

    expect(context.cards[0]?.correspondences?.element).toBeTruthy();
    expect(context.cards[0]?.symbols?.length).toBeGreaterThan(0);
  });

  it("sets focused card only when the slot is revealed", () => {
    const hiddenFocus = buildTarotChatContext(
      "pt",
      spread,
      reading,
      revealedSlotIds,
      reading[2].id,
    );
    const revealedFocus = buildTarotChatContext(
      "pt",
      spread,
      reading,
      revealedSlotIds,
      reading[0].id,
    );

    expect(hiddenFocus.focusedCard).toBeUndefined();
    expect(revealedFocus.focusedCard?.cardName).toBe(reading[0].card.name);
  });

  it("includes learning notes when learning mode is enabled", () => {
    const context = buildTarotChatContext(
      "pt",
      spread,
      reading,
      revealedSlotIds,
      null,
      undefined,
      true,
    );

    expect(context.cards[0]?.positionLearningNote).toBeTruthy();
  });
});
