import { useEffect } from "react";

export const useAmbientSound = (isEnabled: boolean) => {
  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    const AudioContextClass =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const mainGain = context.createGain();
    const lowOscillator = context.createOscillator();
    const highOscillator = context.createOscillator();
    const filter = context.createBiquadFilter();

    lowOscillator.type = "sine";
    lowOscillator.frequency.value = 110;
    highOscillator.type = "triangle";
    highOscillator.frequency.value = 220;
    filter.type = "lowpass";
    filter.frequency.value = 620;
    mainGain.gain.value = 0.018;

    lowOscillator.connect(filter);
    highOscillator.connect(filter);
    filter.connect(mainGain);
    mainGain.connect(context.destination);

    void context.resume();
    lowOscillator.start();
    highOscillator.start();

    return () => {
      lowOscillator.stop();
      highOscillator.stop();
      void context.close();
    };
  }, [isEnabled]);
};
