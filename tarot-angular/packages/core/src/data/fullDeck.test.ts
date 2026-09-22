import { describe, expect, it } from "vitest";
import { fullDeck, FULL_DECK_COUNT, isFullDeck } from "./fullDeck";
import { minorArcana } from "./minorArcana";
import { majorArcana } from "./majorArcana";
import { externalDeckMeta, EXTERNAL_DECK_COUNT } from "./externalDeckMeta";

describe("fullDeck", () => {
  it("contains 78 cards", () => {
    expect(FULL_DECK_COUNT).toBe(78);
    expect(isFullDeck()).toBe(true);
  });

  it("has 22 major and 56 minor arcana", () => {
    expect(majorArcana.length).toBe(22);
    expect(minorArcana.length).toBe(56);
    expect(fullDeck.length).toBe(majorArcana.length + minorArcana.length);
  });

  it("has unique card ids", () => {
    const ids = fullDeck.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("external metadata matches 78 cards", () => {
    expect(EXTERNAL_DECK_COUNT).toBe(78);
    expect(externalDeckMeta.length).toBe(78);
  });
});
