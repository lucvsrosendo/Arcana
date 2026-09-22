import { describe, expect, it } from "vitest";
import { shuffleDeck } from "./shuffleDeck";

describe("shuffleDeck", () => {
  it("returns a new array without mutating the original deck", () => {
    const deck = [1, 2, 3, 4, 5];
    const shuffled = shuffleDeck(deck);

    expect(shuffled).not.toBe(deck);
    expect(deck).toEqual([1, 2, 3, 4, 5]);
  });

  it("keeps every card exactly once", () => {
    const deck = ["a", "b", "c", "d", "e", "f"];
    const shuffled = shuffleDeck(deck);

    expect(shuffled).toHaveLength(deck.length);
    expect([...shuffled].sort()).toEqual([...deck].sort());
  });
});
