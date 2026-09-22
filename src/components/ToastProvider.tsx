import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { toast as sonnerToast } from "sonner";
import { XpGainToast } from "./XpGainToast";

type ToastTone = "info" | "success" | "error";

type ToastContextValue = {
  pushToast: (message: string, tone?: ToastTone) => void;
  pushXpGain: (points: number, label: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const pushXpGain = useCallback((points: number, label: string) => {
    sonnerToast.success(<XpGainToast points={points} label={label} />);
  }, []);

  const pushToast = useCallback((message: string, tone: ToastTone = "info") => {
    if (tone === "success") {
      sonnerToast.success(message);
      return;
    }

    if (tone === "error") {
      sonnerToast.error(message);
      return;
    }

    sonnerToast.message(message);
  }, []);

  const contextValue = useMemo(
    () => ({
      pushToast,
      pushXpGain,
    }),
    [pushToast, pushXpGain],
  );

  return (
    <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }

  return context;
};
