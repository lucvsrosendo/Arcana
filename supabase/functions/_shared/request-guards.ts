// Long chats resend the full UI message history, so the body cap is generous on purpose.
export const MAX_BODY_BYTES = 256 * 1024;
export const MAX_CONTEXT_CHARS = 64_000;

const SUPPORTED_LANGUAGES = new Set(["pt", "en", "es"]);

export class RequestGuardError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const readJsonBody = async (request: Request): Promise<unknown> => {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) {
    throw new RequestGuardError(413, "Payload too large.");
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new RequestGuardError(415, "Expected application/json.");
  }

  // content-length can be absent or wrong with chunked uploads, so measure the real body too.
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new RequestGuardError(413, "Payload too large.");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new RequestGuardError(400, "Invalid JSON body.");
  }
};

export const isWithinSize = (value: unknown, maxChars = MAX_CONTEXT_CHARS) => {
  try {
    return JSON.stringify(value ?? null).length <= maxChars;
  } catch {
    return false;
  }
};

export const pickLanguage = (value: unknown, fallback: string) =>
  typeof value === "string" && SUPPORTED_LANGUAGES.has(value) ? value : fallback;
