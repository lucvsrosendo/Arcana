export const getAuthRedirectUrl = () => {
  // OAuth popup uses postMessage with same-origin checks — always prefer the
  // live browser origin so a drifted Vite port (5174+) does not break Google login.
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, "");
  }

  const configuredSiteUrl = import.meta.env.VITE_SITE_URL?.trim().replace(/\/+$/, "");

  if (configuredSiteUrl) {
    return configuredSiteUrl;
  }

  return undefined;
};

export const getOAuthCallbackUrl = () => {
  const baseUrl = getAuthRedirectUrl();

  if (!baseUrl) {
    return undefined;
  }

  return `${baseUrl}/auth/callback`;
};

export const OAUTH_POPUP_MESSAGE = "tarot:oauth-complete";

export const isGoogleAuthEnabled = () => {
  const flag = import.meta.env.VITE_GOOGLE_AUTH_ENABLED?.trim().toLowerCase();

  if (flag === "false" || flag === "0") {
    return false;
  }

  return true;
};

export const isOAuthProviderDisabledError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("provider is not enabled") ||
    normalized.includes("unsupported provider")
  );
};

export const isSupabaseUnreachableError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("failed to fetch") ||
    normalized.includes("networkerror") ||
    normalized.includes("load failed") ||
    normalized.includes("enotfound") ||
    normalized.includes("err_name_not_resolved") ||
    normalized.includes("supabase unreachable")
  );
};

/** Probe Auth API before opening OAuth popup (catches deleted/paused project DNS). */
export const probeSupabaseAuthReachable = async (
  supabaseUrl: string,
): Promise<{ ok: true } | { ok: false; error: string }> => {
  try {
    const response = await fetch(`${supabaseUrl.replace(/\/+$/, "")}/auth/v1/health`, {
      method: "GET",
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok && response.status >= 500) {
      return { ok: false, error: "supabase unreachable" };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: "supabase unreachable" };
  }
};
