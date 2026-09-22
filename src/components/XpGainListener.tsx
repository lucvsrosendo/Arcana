import { useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import { uiCopy } from "@/data/i18n";
import { useTarot } from "@/hooks/useTarot";
import { useUserProfile } from "@/hooks/useUserProfile";
import { subscribeXpGain } from "@/lib/xpSignals";

/** Bridges cloud XP awards (readings, journal, article) to toast + profile refresh. */
export function XpGainListener() {
  const language = useTarot((state) => state.language);
  const { pushXpGain } = useToast();
  const { refresh } = useUserProfile();
  const xpLabel = uiCopy[language].xpLabel;

  useEffect(() => {
    return subscribeXpGain(({ points }) => {
      pushXpGain(points, xpLabel);
      void refresh();
    });
  }, [pushXpGain, refresh, xpLabel]);

  return null;
}
