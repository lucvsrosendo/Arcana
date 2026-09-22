export type XpGainSignal = {
  points: number;
};

type XpGainListener = (signal: XpGainSignal) => void;

const listeners = new Set<XpGainListener>();

/** Fire after a cloud action that should award XP (DB trigger path). */
export const emitXpGain = (points: number) => {
  if (points <= 0) {
    return;
  }

  const signal: XpGainSignal = { points };
  for (const listener of listeners) {
    listener(signal);
  }
};

export const subscribeXpGain = (listener: XpGainListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
