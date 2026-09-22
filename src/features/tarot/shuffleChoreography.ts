import { SHUFFLE_CARD_COUNT } from "./shuffleTiming";

export type CardHalf = "left" | "right";

export type Card3DPose = {
  x: number;
  y: number;
  z: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  scale: number;
  zIndex: number;
  opacity?: number;
};

export type ShuffleCardPlan = {
  index: number;
  half: CardHalf;
  halfIndex: number;
  riffleOrder: number;
  /** True when this visual card maps back to a reading-stage slot. */
  isSlotCard: boolean;
  slotIndex: number | null;
};

export type SlotRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const seeded = (seed: number, salt: number) => {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export const buildShufflePlan = (
  cardCount = SHUFFLE_CARD_COUNT,
  slotCount = 0,
): ShuffleCardPlan[] => {
  const midpoint = Math.ceil(cardCount / 2);

  return Array.from({ length: cardCount }, (_, index) => {
    const half: CardHalf = index < midpoint ? "left" : "right";
    const halfIndex = half === "left" ? index : index - midpoint;
    const riffleOrder = half === "left" ? halfIndex * 2 : halfIndex * 2 + 1;
    const isSlotCard = index < slotCount;

    return {
      index,
      half,
      halfIndex,
      riffleOrder,
      isSlotCard,
      slotIndex: isSlotCard ? index : null,
    };
  });
};

export const getInterleavedRiffleOrder = (plan: ShuffleCardPlan[]): number[] =>
  [...plan]
    .sort((a, b) => a.riffleOrder - b.riffleOrder)
    .map((card) => card.index);

export const getPackOrigin = (
  stageSize: { width: number; height: number },
  cardSize: { width: number; height: number },
) => ({
  x: stageSize.width / 2 - cardSize.width / 2,
  y: stageSize.height / 2 - cardSize.height / 2,
});

export const getSlotPose = (rect: SlotRect): Card3DPose => ({
  x: rect.x,
  y: rect.y,
  z: 0,
  rotateX: 0,
  rotateY: 0,
  rotateZ: 0,
  scale: 1,
  zIndex: 20,
});

export const getExtraBirthPose = (
  index: number,
  origin: { x: number; y: number },
  seed: number,
): Card3DPose => {
  const jitter = (seeded(seed, index + 301) - 0.5) * 4;

  return {
    x: origin.x + jitter,
    y: origin.y - index * 0.4,
    z: -8 - index * 1.1,
    rotateX: 8,
    rotateY: jitter * 0.3,
    rotateZ: jitter * 0.5,
    scale: 0.96,
    zIndex: 5 + index,
  };
};

export const offsetPose = (
  origin: { x: number; y: number },
  pose: Card3DPose,
): Card3DPose => ({
  ...pose,
  x: origin.x + pose.x,
  y: origin.y + pose.y,
});

export const getPackedPose = (index: number, seed: number): Card3DPose => {
  const jitterX = (seeded(seed, index + 51) - 0.5) * 1.8;
  const jitterY = (seeded(seed, index + 67) - 0.5) * 1.4;
  const jitterR = (seeded(seed, index + 83) - 0.5) * 1.2;

  return {
    x: jitterX,
    y: -index * 0.55 + jitterY,
    z: -index * 1.15,
    rotateX: 14,
    rotateY: jitterR * 0.4,
    rotateZ: jitterR,
    scale: 1,
    zIndex: 40 + index,
  };
};

export const getSplitPose = (
  card: ShuffleCardPlan,
  seed: number,
): Card3DPose => {
  const side = card.half === "left" ? -1 : 1;
  const stackLift = card.halfIndex * 0.7;
  const jitter = (seeded(seed, card.index + 101) - 0.5) * 4;

  return {
    x: side * 118 + jitter,
    y: -8 - stackLift,
    z: -card.halfIndex * 1.4 + side * 12,
    rotateX: 18,
    rotateY: side * -28 + jitter * 0.4,
    rotateZ: side * -8 + jitter * 0.2,
    scale: 1,
    zIndex: 50 + card.halfIndex,
  };
};

export const getRiffleFlightPose = (
  card: ShuffleCardPlan,
  seed: number,
): Card3DPose => {
  const side = card.half === "left" ? -1 : 1;
  const jitter = (seeded(seed, card.index + 131) - 0.5) * 10;

  return {
    x: side * 42 + jitter,
    y: -54 - card.halfIndex * 1.5,
    z: 36 + card.riffleOrder * 1.2,
    rotateX: 42 + Math.abs(jitter),
    rotateY: side * -12,
    rotateZ: side * 18 + jitter * 0.3,
    scale: 1.02,
    zIndex: 80 + card.riffleOrder,
  };
};

export const getRiffleLandPose = (
  card: ShuffleCardPlan,
  seed: number,
): Card3DPose => {
  const jitterX = (seeded(seed, card.index + 151) - 0.5) * 2.4;
  const jitterZ = (seeded(seed, card.index + 171) - 0.5) * 1.2;

  return {
    x: jitterX,
    y: -card.riffleOrder * 0.45,
    z: -card.riffleOrder * 1.1 + jitterZ,
    rotateX: 10,
    rotateY: (seeded(seed, card.index + 191) - 0.5) * 2,
    rotateZ: (seeded(seed, card.index + 211) - 0.5) * 2.5,
    scale: 1,
    zIndex: 60 + card.riffleOrder,
  };
};

export const getBridgePose = (
  card: ShuffleCardPlan,
  total: number,
  seed: number,
): Card3DPose => {
  const centered = card.riffleOrder - (total - 1) / 2;
  const norm = centered / Math.max((total - 1) / 2, 1);
  const arch = (1 - norm * norm) * 58;
  const jitter = (seeded(seed, card.index + 231) - 0.5) * 3;

  return {
    x: centered * 9.5 + jitter,
    y: -arch,
    z: -Math.abs(centered) * 1.8,
    rotateX: 54 - Math.abs(norm) * 18,
    rotateY: centered * -1.8,
    rotateZ: centered * 2.4,
    scale: 1,
    zIndex: 90 + Math.round(arch),
  };
};

export const getSquaredPose = (index: number, seed: number): Card3DPose => {
  const jitter = (seeded(seed, index + 251) - 0.5) * 1.2;

  return {
    x: jitter,
    y: -index * 0.45,
    z: -index * 1.05,
    rotateX: 10,
    rotateY: jitter * 0.4,
    rotateZ: jitter * 0.6,
    scale: 1,
    zIndex: 70 + index,
  };
};

export const getAbsorbPose = (
  index: number,
  origin: { x: number; y: number },
  seed: number,
): Card3DPose => {
  const packed = getPackedPose(index, seed);
  return {
    ...offsetPose(origin, packed),
    scale: 0.15,
    opacity: 0,
    z: packed.z - 40,
    zIndex: 1,
  };
};

export const poseToMotion = (pose: Card3DPose) => ({
  x: pose.x,
  y: pose.y,
  z: pose.z,
  rotateX: pose.rotateX,
  rotateY: pose.rotateY,
  rotateZ: pose.rotateZ,
  scale: pose.scale,
  opacity: pose.opacity ?? 1,
});
