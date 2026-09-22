import { describe, expect, it } from "vitest";
import { normalizeNewsMarkdown } from "./normalizeNewsMarkdown";

describe("normalizeNewsMarkdown", () => {
  it("unescapes heading markers at line start", () => {
    const input = "\\## Section\n\nParagraph";
    expect(normalizeNewsMarkdown(input)).toBe("## Section\n\nParagraph");
  });

  it("leaves normal markdown unchanged", () => {
    const input = "## Title\n\nNormal **bold** text.";
    expect(normalizeNewsMarkdown(input)).toBe(input);
  });
});
