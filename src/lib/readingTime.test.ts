import { describe, expect, it } from "vitest";
import { estimateReadingMinutes } from "./readingTime";

describe("estimateReadingMinutes", () => {
  it("returns 1 for empty text", () => {
    expect(estimateReadingMinutes("")).toBe(1);
    expect(estimateReadingMinutes("   ")).toBe(1);
  });

  it("estimates minutes from word count at 200 wpm", () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    expect(estimateReadingMinutes(words)).toBe(2);
  });

  it("rounds up partial minutes", () => {
    const words = Array.from({ length: 201 }, (_, i) => `word${i}`).join(" ");
    expect(estimateReadingMinutes(words)).toBe(2);
  });
});
