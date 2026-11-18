const BASE_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept-language, x-digest-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};

/** Comma-separated origins. `*` or empty keeps the public API callable (same-origin proxy). */
const allowedOrigins = () =>
  (Deno.env.get("ALLOWED_ORIGIN") ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0 && origin !== "*");

export const isOriginAllowed = (request: Request) => {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  const allowlist = allowedOrigins();
  if (allowlist.length === 0) {
    return true;
  }

  return allowlist.includes(origin);
};

export const buildCorsHeaders = (request: Request): Record<string, string> => {
  const headers: Record<string, string> = { ...BASE_HEADERS };
  const origin = request.headers.get("origin");
  const allowlist = allowedOrigins();

  if (!origin) {
    return headers;
  }

  if (allowlist.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
    return headers;
  }

  if (allowlist.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
};
