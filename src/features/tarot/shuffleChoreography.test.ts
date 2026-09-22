import { describe, expect, it } from "vitest";
import {
  buildShufflePlan,
  getInterleavedRiffleOrder,
  getSplitPose,
  getRiffleLandPose,
  getBridgePose,
} from "./shuffleChoreography";
import {
  SHUFFLE_CARD_COUNT,
  SHUFFLE_REDUCED_MS,
  SHUFFLE_SEQUENCE_MS,
  SHUFFLE_SEGMENTS_MS,
} from "./shuffleTiming";

describe("shuffleChoreography", () => {
  it("splits the deck into two contiguous halves", () => {
    const plan = buildShufflePlan(20);
    const left = plan.filter((card) => card.half === "left");
    const right = plan.filter((card) => card.half === "right");

    expect(plan).toHaveLength(20);
    expect(left).toHaveLength(10);
    expect(right).toHaveLength(10);
    expect(left.every((card, index) => card.halfIndex === index)).toBe(true);
    expect(right.every((card, index) => card.halfIndex === index)).toBe(true);
  });

  it("interleaves left and right cards for the riffle", () => {
    const plan = buildShufflePlan(8);
    expect(getInterleavedRiffleOrder(plan)).toEqual([0, 4, 1, 5, 2, 6, 3, 7]);
  });

  it("separates split halves on opposite X axes", () => {
    const plan = buildShufflePlan(6);
    const left = getSplitPose(plan[0]!, 12);
    const right = getSplitPose(plan[3]!, 12);

    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeGreaterThan(0);
    expect(left.rotateY).not.toEqual(right.rotateY);
  });

  it("lands riffled cards near center with growing depth", () => {
    const plan = buildShufflePlan(SHUFFLE_CARD_COUNT);
    const first = getRiffleLandPose(plan[0]!, 7);
    const later = getRiffleLandPose(
      plan.find((card) => card.riffleOrder === 10)!,
      7,
    );

    expect(Math.abs(first.x)).toBeLessThan(8);
    expect(later.z).toBeLessThan(first.z);
  });

  it("builds a bridge arch that peaks near the center", () => {
    const plan = buildShufflePlan(12);
    const edge = getBridgePose(plan[0]!, 12, 3);
    const center = getBridgePose(
      plan.find((card) => card.riffleOrder === 5)!,
      12,
      3,
    );

    expect(center.y).toBeLessThan(edge.y);
    expect(center.rotateX).toBeGreaterThan(30);
  });

  it("marks the first cards as slot cards when slots are provided", () => {
    const plan = buildShufflePlan(20, 3);
    expect(plan.filter((card) => card.isSlotCard)).toHaveLength(3);
    expect(plan[0]?.slotIndex).toBe(0);
    expect(plan[3]?.isSlotCard).toBe(false);
  });
});

describe("shuffleTiming", () => {
  it("exports a full-motion duration matching the segment sum", () => {
    const segmentSum = Object.values(SHUFFLE_SEGMENTS_MS).reduce(
      (total, value) => total + value,
      0,
    );
    expect(SHUFFLE_SEQUENCE_MS).toBe(segmentSum);
    expect(SHUFFLE_SEQUENCE_MS).toBeGreaterThan(3500);
  });

  it("keeps a short but visible reduced-motion duration", () => {
    expect(SHUFFLE_REDUCED_MS).toBeGreaterThan(600);
    expect(SHUFFLE_REDUCED_MS).toBeLessThan(SHUFFLE_SEQUENCE_MS);
  });
});
