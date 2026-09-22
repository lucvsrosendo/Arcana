// @vitest-environment happy-dom
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ShuffleDeckSequence } from "./ShuffleDeckSequence";
import { SHUFFLE_REDUCED_MS } from "../shuffleTiming";

const { animateMock } = vi.hoisted(() => ({
  animateMock: vi.fn(async (..._args: unknown[]) => undefined),
}));

vi.mock("motion/react", async () => {
  const React = await import("react");
  return {
    animate: animateMock,
    motion: {
      div: ({
        children,
        ...props
      }: React.HTMLAttributes<HTMLDivElement> & {
        children?: React.ReactNode;
        initial?: unknown;
        animate?: unknown;
        exit?: unknown;
        transition?: unknown;
        style?: React.CSSProperties;
      }) => <div {...props}>{children}</div>,
    },
    useReducedMotion: () => true,
  };
});

describe("ShuffleDeckSequence FLIP overlay", () => {
  afterEach(() => {
    animateMock.mockClear();
    vi.useRealTimers();
  });

  it("covers measured slot rects and completes once without fades", async () => {
    const onComplete = vi.fn();
    const slotRects = [
      { x: 40, y: 20, width: 96, height: 144 },
      { x: 180, y: 20, width: 96, height: 144 },
      { x: 320, y: 20, width: 96, height: 144 },
    ];

    const { container } = render(
      <ShuffleDeckSequence
        slotRects={slotRects}
        stageSize={{ width: 480, height: 280 }}
        seed={42}
        onComplete={onComplete}
      />,
    );

    expect(container.querySelector(".shuffle-overlay")).toBeTruthy();
    expect(container.querySelectorAll("[data-shuffle-card]").length).toBeGreaterThanOrEqual(3);
    expect(container.querySelectorAll(".is-slot-card").length).toBe(3);

    await waitFor(
      () => {
        expect(onComplete).toHaveBeenCalledTimes(1);
      },
      { timeout: SHUFFLE_REDUCED_MS + 1500 },
    );

    expect(animateMock.mock.calls.length).toBeGreaterThan(2);
  });
});
