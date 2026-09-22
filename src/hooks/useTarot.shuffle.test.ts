// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useTarot } from "./useTarot";

describe("useTarot shuffle flow", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useTarot.setState({
      isShuffling: false,
      revealedSlotIds: [],
      selectedDeckCardIds: [],
      readingQuestion: "",
      currentReadingSaved: false,
    });
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("preserves the reading question when requested", () => {
    useTarot.setState({ readingQuestion: "Devo aceitar o emprego?" });

    useTarot.getState().drawReading(undefined, { preserveQuestion: true });

    expect(useTarot.getState().isShuffling).toBe(true);
    expect(useTarot.getState().readingQuestion).toBe("Devo aceitar o emprego?");
    expect(useTarot.getState().revealedSlotIds).toEqual([]);
  });

  it("clears the reading question by default on a new draw", () => {
    useTarot.setState({ readingQuestion: "Pergunta antiga" });

    useTarot.getState().drawReading();

    expect(useTarot.getState().readingQuestion).toBe("");
    expect(useTarot.getState().isShuffling).toBe(true);
  });

  it("applies a new deck only when finishShuffle runs", () => {
    const previousDeck = useTarot.getState().deck;

    useTarot.getState().drawReading(undefined, { preserveQuestion: true });
    expect(useTarot.getState().deck).toBe(previousDeck);

    useTarot.getState().finishShuffle();

    const nextState = useTarot.getState();
    expect(nextState.isShuffling).toBe(false);
    expect(nextState.deck).toHaveLength(previousDeck.length);
    expect(nextState.deck.map((card) => card.id).sort()).toEqual(
      previousDeck.map((card) => card.id).sort(),
    );
  });

  it("ignores repeated finishShuffle calls after completion", () => {
    useTarot.getState().drawReading();
    useTarot.getState().finishShuffle();
    const afterFirst = useTarot.getState().deck;

    useTarot.getState().finishShuffle();
    expect(useTarot.getState().deck).toBe(afterFirst);
  });

  it("safety timeout still completes an unfinished shuffle", () => {
    useTarot.getState().drawReading();
    expect(useTarot.getState().isShuffling).toBe(true);

    vi.advanceTimersByTime(6_000);

    expect(useTarot.getState().isShuffling).toBe(false);
  });
});
