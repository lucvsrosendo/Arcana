import { OAUTH_POPUP_MESSAGE } from "./authRedirect";
import { supabase } from "./supabaseClient";

export type OAuthPopupResult = {
  ok: boolean;
  error?: string;
};

const POPUP_WIDTH = 480;
const POPUP_HEIGHT = 640;
const POPUP_POLL_MS = 400;
const POPUP_TIMEOUT_MS = 5 * 60 * 1000;

const getPopupFeatures = () => {
  const left = Math.max(0, window.screenX + (window.outerWidth - POPUP_WIDTH) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - POPUP_HEIGHT) / 2);

  return [
    `width=${POPUP_WIDTH}`,
    `height=${POPUP_HEIGHT}`,
    `left=${left}`,
    `top=${top}`,
    "popup=yes",
    "toolbar=no",
    "menubar=no",
    "scrollbars=yes",
    "resizable=yes",
  ].join(",");
};

const readSessionAfterPopup = async () => {
  if (!supabase) {
    return false;
  }

  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
};

export const openOAuthPopup = (url: string): Promise<OAuthPopupResult> =>
  new Promise((resolve) => {
    const popup = window.open(url, "tarot-oauth", getPopupFeatures());

    if (!popup) {
      resolve({ ok: false, error: "popup-blocked" });
      return;
    }

    popup.focus();

    let settled = false;

    const finish = (result: OAuthPopupResult) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
      window.removeEventListener("message", onMessage);

      if (!popup.closed) {
        popup.close();
      }

      resolve(result);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== OAUTH_POPUP_MESSAGE) {
        return;
      }

      finish({
        ok: Boolean(event.data.ok),
        error: typeof event.data.error === "string" ? event.data.error : undefined,
      });
    };

    window.addEventListener("message", onMessage);

    const pollTimer = window.setInterval(() => {
      if (!popup.closed) {
        return;
      }

      void readSessionAfterPopup().then((hasSession) => {
        finish({
          ok: hasSession,
          error: hasSession ? undefined : "popup-closed",
        });
      });
    }, POPUP_POLL_MS);

    const timeoutTimer = window.setTimeout(() => {
      finish({ ok: false, error: "popup-timeout" });
    }, POPUP_TIMEOUT_MS);
  });
