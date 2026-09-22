import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { useTarot } from "@/hooks/useTarot";

const copy = {
  pt: {
    title: "Nova versao disponivel",
    reload: "Recarregar",
    dismiss: "Depois",
  },
  en: {
    title: "New version available",
    reload: "Reload",
    dismiss: "Later",
  },
  es: {
    title: "Nueva version disponible",
    reload: "Recargar",
    dismiss: "Despues",
  },
} as const;

export function PwaReloadPrompt() {
  const language = useTarot((state) => state.language);
  const labels = copy[language];
  const location = useLocation();
  const [dismissedPath, setDismissedPath] = useState<string | null>(null);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
  });

  useEffect(() => {
    if (dismissedPath && dismissedPath !== location.pathname) {
      setDismissedPath(null);
    }
  }, [dismissedPath, location.pathname]);

  if (!needRefresh || dismissedPath === location.pathname) {
    return null;
  }

  return (
    <div className="pwa-strip" role="alert">
      <p className="pwa-strip__text">{labels.title}</p>
      <div className="pwa-strip__actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setDismissedPath(location.pathname);
            setNeedRefresh(true);
          }}
        >
          {labels.dismiss}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            void updateServiceWorker(true);
          }}
        >
          {labels.reload}
        </Button>
      </div>
    </div>
  );
}
