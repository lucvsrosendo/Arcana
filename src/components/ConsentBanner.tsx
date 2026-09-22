import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { hasAnalyticsConsent as readAnalyticsConsent, initAnalytics } from "@/lib/analytics";
import { uiCopy } from "@/data/i18n";
import { useTarot } from "@/hooks/useTarot";

const CONSENT_KEY = "tarot:lgpd-consent";

export type ConsentChoice = "accepted" | "rejected" | null;

export const getStoredConsent = (): ConsentChoice => {
  if (typeof window === "undefined") {
    return null;
  }

  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "accepted" || value === "rejected") {
    return value;
  }

  return null;
};

export const hasAnalyticsConsent = () => readAnalyticsConsent();

export function ConsentBanner() {
  const language = useTarot((state) => state.language);
  const copy = uiCopy[language];
  const [choice, setChoice] = useState<ConsentChoice>(() => getStoredConsent());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const cookiebotId = import.meta.env.VITE_COOKIEBOT_ID as string | undefined;
    if (cookiebotId?.trim()) {
      const scriptId = "Cookiebot";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://consent.cookiebot.com/uc.js";
        script.setAttribute("data-cbid", cookiebotId.trim());
        script.async = true;
        document.head.appendChild(script);
      }
      return;
    }
  }, []);

  const persist = (value: ConsentChoice) => {
    if (value) {
      localStorage.setItem(CONSENT_KEY, value);
    }
    setChoice(value);
    if (value === "accepted") {
      initAnalytics();
    }
  };

  if (choice || import.meta.env.VITE_COOKIEBOT_ID) {
    return null;
  }

  return (
    <div role="dialog" aria-label={copy.consentTitle} className="consent-strip">
      <div className="consent-strip__inner">
        <div className="consent-strip__text">
          <p className="consent-strip__title">{copy.consentTitle}</p>
          <p className="consent-strip__desc">{copy.consentDescription}</p>
        </div>
        <div className="consent-strip__actions">
          <Button type="button" size="sm" onClick={() => persist("accepted")}>
            {copy.consentAccept}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => persist("rejected")}>
            {copy.consentReject}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => navigateToLegal("cookies")}>
            {copy.legalCookies}
          </Button>
        </div>
      </div>
    </div>
  );
}

const navigateToLegal = (page: "cookies") => {
  window.location.assign(`/${page}`);
};
