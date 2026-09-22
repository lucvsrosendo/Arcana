import { describe, expect, it } from "vitest";
import { findSpecialCombinations } from "./history";
import { majorArcana } from "../data/majorArcana";

describe("history helpers", () => {
  it("detects known special combinations", () => {
    const tower = majorArcana.find((card) => card.id === "the-tower");
    const star = majorArcana.find((card) => card.id === "the-star");
    const cards = [tower, star]
      .filter((card) => Boolean(card))
      .map((card, index) => ({
      id: `slot-${index}`,
      position: {
        id: `pos-${index}`,
        title: `Pos ${index + 1}`,
        prompt: "",
        learningNote: "",
      },
      card: card!,
    }));

    const combinations = findSpecialCombinations(cards, "pt");
    expect(combinations.length).toBeGreaterThan(0);
  });
});
