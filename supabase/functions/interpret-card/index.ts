import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  buildCardInsightInstructions,
  buildCardInsightUserMessage,
  detectLanguage,
  getCardInsightMaxTokens,
  getCardInsightModel,
  getProviderErrorMessage,
  isGroqConfigured,
  providerErrorMessages,
  type CardInsightPayload,
} from "../_shared/chat-helpers.ts";
import { isRateLimited } from "../_shared/rate-limit.ts";
import {
  RequestGuardError,
  isWithinSize,
  pickLanguage,
  readJsonBody,
} from "../_shared/request-guards.ts";
import { buildCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";

const MAX_QUESTION_CHARS = 1_000;
const MAX_PAYLOAD_CHARS = 16_000;

const jsonResponse = (request: Request, status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...buildCorsHeaders(request),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY",
    },
  });

const isValidPayload = (payload: unknown): payload is CardInsightPayload => {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const value = payload as CardInsightPayload;
  return (
    typeof value.question === "string" &&
    value.question.trim().length > 0 &&
    typeof value.spread === "object" &&
    value.spread !== null &&
    typeof value.position === "object" &&
    value.position !== null &&
    typeof value.card === "object" &&
    value.card !== null &&
    typeof value.card.name === "string"
  );
};

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: buildCorsHeaders(request) });
  }

  if (request.method !== "POST") {
    return jsonResponse(request, 405, { error: "Method not allowed" });
  }

  if (!isOriginAllowed(request)) {
    return jsonResponse(request, 403, { error: "Origin not allowed." });
  }

  const headerLanguage = detectLanguage(request.headers.get("accept-language"));

  if (await isRateLimited(request)) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    return jsonResponse(request, 429, { error: localized.rateLimit });
  }

  if (!isGroqConfigured()) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    return jsonResponse(request, 503, { error: localized.missingKey });
  }

  try {
    const body = await readJsonBody(request);
    const payload = body as CardInsightPayload;

    if (!isValidPayload(payload)) {
      return jsonResponse(request, 400, { error: "Missing or invalid card insight payload." });
    }

    payload.question = payload.question.slice(0, MAX_QUESTION_CHARS);

    if (!isWithinSize(payload, MAX_PAYLOAD_CHARS)) {
      return jsonResponse(request, 413, { error: "Card insight payload is too large." });
    }

    const language = pickLanguage(payload.language, headerLanguage);
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getCardInsightModel(),
        messages: [
          {
            role: "system",
            content: buildCardInsightInstructions(language),
          },
          {
            role: "user",
            content: buildCardInsightUserMessage({ ...payload, language }),
          },
        ],
        max_tokens: getCardInsightMaxTokens(),
        temperature: 0.8,
      }),
    });

    const groqPayload = await groqResponse.json();

    if (!groqResponse.ok) {
      return jsonResponse(request, groqResponse.status, {
        error: getProviderErrorMessage(
          groqResponse.status,
          groqPayload.error?.message,
          language,
        ),
      });
    }

    const insight = groqPayload.choices?.[0]?.message?.content?.trim() ?? "";

    if (!insight) {
      return jsonResponse(request, 502, { error: "Groq returned an empty response." });
    }

    return jsonResponse(request, 200, { insight });
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return jsonResponse(request, error.status, { error: error.message });
    }

    console.error("interpret-card function failed", error);
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    return jsonResponse(request, 500, { error: localized.unavailable });
  }
});
