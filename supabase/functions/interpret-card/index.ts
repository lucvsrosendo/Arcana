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

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  Vary: "Origin",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, accept-language",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
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
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  const headerLanguage = detectLanguage(request.headers.get("accept-language"));

  if (await isRateLimited(request)) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    return jsonResponse(429, { error: localized.rateLimit });
  }

  if (!isGroqConfigured()) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    return jsonResponse(503, { error: localized.missingKey });
  }

  try {
    const body = await request.json();
    const payload = body as CardInsightPayload;

    if (!isValidPayload(payload)) {
      return jsonResponse(400, { error: "Missing or invalid card insight payload." });
    }

    const language = payload.language ?? headerLanguage;
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
      return jsonResponse(groqResponse.status, {
        error: getProviderErrorMessage(
          groqResponse.status,
          groqPayload.error?.message,
          language,
        ),
      });
    }

    const insight = groqPayload.choices?.[0]?.message?.content?.trim() ?? "";

    if (!insight) {
      return jsonResponse(502, { error: "Groq returned an empty response." });
    }

    return jsonResponse(200, { insight });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unexpected card insight error.",
    });
  }
});
