import { describe, expect, it } from "vitest";
import { XP_BAR_SCALE, XP_RULES, getXpBarProgress, getXpLevel } from "./xpRules";

describe("xpRules", () => {
  it("defines the expected XP amounts", () => {
    expect(XP_RULES.commentCreated).toBe(15);
    expect(XP_RULES.likeGiven).toBe(3);
    expect(XP_RULES.likeReceived).toBe(6);
    expect(XP_RULES.favoriteGiven).toBe(4);
    expect(XP_RULES.favoriteReceived).toBe(12);
    expect(XP_RULES.articleReadComplete).toBe(10);
    expect(XP_RULES.readingSaved).toBe(8);
    expect(XP_RULES.journalEntry).toBe(12);
  });

  it("caps the visual XP bar at 100%", () => {
    expect(getXpBarProgress(0)).toBe(0);
    expect(getXpBarProgress(XP_BAR_SCALE / 2)).toBe(50);
    expect(getXpBarProgress(XP_BAR_SCALE)).toBe(100);
    expect(getXpBarProgress(XP_BAR_SCALE * 4)).toBe(100);
  });

  it("maps XP totals to reader/sage/oracle levels", () => {
    expect(getXpLevel(0).id).toBe("reader");
    expect(getXpLevel(200).id).toBe("sage");
    expect(getXpLevel(450).id).toBe("oracle");
  });
});
