import { describe, expect, it } from "vitest";
import { majorArcana } from "../data/majorArcana";
import { getLocalizedSpreadDefinition } from "../data/i18n";
import {
  buildCardInsightCacheKey,
  buildCardInsightPayload,
  getCardInsightFallbackText,
} from "./cardInsight";
import { createReadingFromSpread } from "./readings";

describe("cardInsight", () => {
  const spread = getLocalizedSpreadDefinition("three-card", "pt");
  const reading = createReadingFromSpread(spread, majorArcana, {
    enableReversals: false,
  });
  const slot = reading[0];

  it("builds payload with question, spread, position and card", () => {
    const payload = buildCardInsightPayload(
      "pt",
      "Devo mudar de emprego?",
      spread,
      slot,
      [],
    );

    expect(payload.question).toBe("Devo mudar de emprego?");
    expect(payload.spread.id).toBe("three-card");
    expect(payload.position.title).toBeTruthy();
    expect(payload.card.name).toBe(slot.card.name);
    expect(payload.revealedSoFar).toEqual([]);
  });

  it("includes other revealed cards in revealedSoFar", () => {
    const payload = buildCardInsightPayload(
      "pt",
      "Como fica meu relacionamento?",
      spread,
      reading[1],
      [reading[0]],
    );

    expect(payload.revealedSoFar).toHaveLength(1);
    expect(payload.revealedSoFar?.[0]?.cardName).toBe(reading[0].card.name);
  });

  it("creates stable cache keys per question and slot", () => {
    const keyA = buildCardInsightCacheKey("Pergunta A", slot);
    const keyB = buildCardInsightCacheKey("Pergunta B", slot);

    expect(keyA).not.toBe(keyB);
    expect(buildCardInsightCacheKey("Pergunta A", slot)).toBe(keyA);
  });

  it("falls back to daily advice or description", () => {
    const fallback = getCardInsightFallbackText(slot);

    expect(fallback).toBeTruthy();
    expect(typeof fallback).toBe("string");
  });
});
