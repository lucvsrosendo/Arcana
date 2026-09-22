/** Shared timing for the 3D shuffle choreography and store safety timeout. */

export const SHUFFLE_SEGMENTS_MS = {
  gather: 480,
  split: 520,
  riffle: 1500,
  bridge: 720,
  square: 420,
  deal: 620,
} as const;

export const SHUFFLE_REDUCED_SEGMENTS_MS = {
  gather: 220,
  split: 280,
  close: 320,
} as const;

export const SHUFFLE_CARD_COUNT = 20;

export const SHUFFLE_SEQUENCE_MS = Object.values(SHUFFLE_SEGMENTS_MS).reduce(
  (total, value) => total + value,
  0,
);

export const SHUFFLE_REDUCED_MS = Object.values(SHUFFLE_REDUCED_SEGMENTS_MS).reduce(
  (total, value) => total + value,
  0,
);
