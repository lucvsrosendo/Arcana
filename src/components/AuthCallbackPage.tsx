import { useEffect, useRef } from "react";
import { OAUTH_POPUP_MESSAGE } from "../lib/authRedirect";
import { supabase } from "../lib/supabaseClient";
import { uiCopy } from "../data/i18n";

const detectLanguage = (): keyof typeof uiCopy => {
  if (typeof document === "undefined") return "pt";
  const lang = document.documentElement.lang;
  if (lang.startsWith("en")) return "en";
  if (lang.startsWith("es")) return "es";
  return "pt";
};

const notifyOpener = (ok: boolean, error?: string) => {
  if (!window.opener || window.opener.closed) {
    return;
  }

  window.opener.postMessage(
    { type: OAUTH_POPUP_MESSAGE, ok, error },
    window.location.origin,
  );
};

const closePopup = () => {
  window.close();

  if (!window.closed) {
    window.location.replace("/home");
  }
};

export function AuthCallbackPage() {
  const finishedRef = useRef(false);

  useEffect(() => {
    if (!supabase) {
      notifyOpener(false, "supabase-not-configured");
      closePopup();
      return;
    }

    const finish = (ok: boolean, error?: string) => {
      if (finishedRef.current) {
        return;
      }

      finishedRef.current = true;
      notifyOpener(ok, error);
      closePopup();
    };

    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));

    const oauthError =
      search.get("error_description") ??
      hash.get("error_description") ??
      search.get("error") ??
      hash.get("error");

    if (oauthError) {
      finish(false, oauthError);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        finish(true);
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        finish(true);
      }
    });

    const timeout = window.setTimeout(() => {
      finish(false, "oauth-timeout");
    }, 30_000);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, []);

  const copy = uiCopy[detectLanguage()];

  return (
    <div className="theme-root">
      <div className="auth-callback-shell">
        <div className="auth-callback-brand">
          <span className="auth-callback-brand-mark" aria-hidden="true">XVIII</span>
          <span className="auth-callback-brand-name">{copy.appBrand}</span>
        </div>
        <p className="auth-callback-label">{copy.authConnecting}</p>
      </div>
    </div>
  );
}
