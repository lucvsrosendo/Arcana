import { describe, expect, it, vi } from "vitest";
import { emitXpGain, subscribeXpGain } from "./xpSignals";
import { XP_RULES } from "../data/xpRules";

describe("xpSignals", () => {
  it("notifies subscribers with positive XP gains", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeXpGain(listener);

    emitXpGain(XP_RULES.commentCreated);
    emitXpGain(0);
    emitXpGain(-5);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({ points: XP_RULES.commentCreated });

    unsubscribe();
    emitXpGain(XP_RULES.journalEntry);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("keeps XP_RULES aligned with site award amounts", () => {
    expect(XP_RULES).toMatchObject({
      commentCreated: 15,
      likeGiven: 3,
      likeReceived: 6,
      favoriteGiven: 4,
      favoriteReceived: 12,
      articleReadComplete: 10,
      journalEntry: 12,
    });
  });
});