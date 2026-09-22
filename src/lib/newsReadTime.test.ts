import { describe, expect, it } from "vitest";
import { estimateReadMinutes } from "./newsReadTime";

describe("newsReadTime", () => {
  it("returns at least one minute", () => {
    expect(estimateReadMinutes("")).toBe(1);
    expect(estimateReadMinutes("short")).toBe(1);
  });

  it("estimates longer articles", () => {
    const longText = Array.from({ length: 450 }, () => "word").join(" ");
    expect(estimateReadMinutes(longText)).toBeGreaterThanOrEqual(2);
  });
});
