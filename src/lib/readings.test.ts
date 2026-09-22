import { describe, expect, it } from "vitest";
import { majorArcana } from "../data/majorArcana";
import { getSpreadDefinition } from "../data/spreads";
import { createReadingFromSpread, getDailyCard, getTodayKey } from "./readings";

describe("reading helpers", () => {
  it("creates one reading slot for each spread position", () => {
    const spread = getSpreadDefinition("hand-of-eris");
    const reading = createReadingFromSpread(spread, majorArcana);

    expect(reading).toHaveLength(spread.positions.length);
    expect(reading.map((slot) => slot.position.title)).toEqual(
      spread.positions.map((position) => position.title),
    );
  });

  it("does not repeat cards when the source deck has unique cards", () => {
    const spread = getSpreadDefinition("celtic-cross");
    const reading = createReadingFromSpread(spread, majorArcana);
    const cardIds = reading.map((slot) => slot.card.id);

    expect(new Set(cardIds).size).toBe(cardIds.length);
  });

  it("keeps the daily card stable for the same calendar date", () => {
    const date = new Date(2026, 4, 28);

    expect(getTodayKey(date)).toBe("2026-05-28");
    expect(getDailyCard(date)).toEqual(getDailyCard(date));
  });
});
