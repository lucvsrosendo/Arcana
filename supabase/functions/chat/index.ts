import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { streamText } from "npm:ai@6";
import { createGroq } from "npm:@ai-sdk/groq@3";
import {
  buildGroqMessages,
  detectLanguage,
  getChatModel,
  getMaxTokens,
  isGroqConfigured,
  providerErrorMessages,
  sanitizeMessages,
  type TarotChatContext,
} from "../_shared/chat-helpers.ts";
import { isRateLimited } from "../_shared/rate-limit.ts";
import {
  RequestGuardError,
  isWithinSize,
  pickLanguage,
  readJsonBody,
} from "../_shared/request-guards.ts";
import { buildCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";

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
    const body = (await readJsonBody(request)) as Record<string, unknown> | null;
    if (!body || typeof body !== "object") {
      return jsonResponse(request, 400, { error: "Invalid request body." });
    }

    const rawContext = body.context ?? { language: headerLanguage };
    if (typeof rawContext !== "object" || rawContext === null || !isWithinSize(rawContext)) {
      return jsonResponse(request, 413, { error: "Reading context is too large." });
    }

    const context = rawContext as TarotChatContext;
    context.language = pickLanguage(context.language, headerLanguage);
    context.deepMode = context.deepMode === true;
    const messages = sanitizeMessages(body.messages);
    const userMessage = messages[messages.length - 1]?.content;

    if (typeof userMessage !== "string" || !userMessage.trim()) {
      return jsonResponse(request, 400, { error: "Missing user message." });
    }

    let groqMessages = buildGroqMessages(context, messages);

    if (
      Deno.env.get("ENABLE_WEB_SEARCH") === "true" &&
      body.enableWebSearch === true &&
      typeof userMessage === "string"
    ) {
      const { webSearch } = await import("../_shared/web-search.ts");
      const searchSnippet = await webSearch(userMessage);
      groqMessages = [
        ...groqMessages.slice(0, -1),
        {
          role: "user" as const,
          content: `${userMessage}\n\nRelevant web context:\n${searchSnippet}`,
        },
      ];
    }

    if (Deno.env.get("ENABLE_AI_SDK") === "true" && body.useAiSdk === true) {
      const groq = createGroq({ apiKey: Deno.env.get("GROQ_API_KEY") });
      const systemMessage = groqMessages.find((message) => message.role === "system");
      const otherMessages = groqMessages.filter((message) => message.role !== "system");

      const result = streamText({
        model: groq(getChatModel(context)),
        system: systemMessage?.content,
        messages: otherMessages,
        maxOutputTokens: getMaxTokens(context),
        temperature: 0.7,
      });

      const response = result.toUIMessageStreamResponse({
        headers: {
          ...buildCorsHeaders(request),
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
          "X-Frame-Options": "DENY",
        },
      });

      return response;
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: getChatModel(context),
        messages: groqMessages,
        max_tokens: getMaxTokens(context),
        temperature: 0.7,
      }),
    });

    const payload = await groqResponse.json();

    if (!groqResponse.ok) {
      const { getProviderErrorMessage } = await import("../_shared/chat-helpers.ts");
      return jsonResponse(request, groqResponse.status, {
        error: getProviderErrorMessage(
          groqResponse.status,
          payload.error?.message,
          headerLanguage,
        ),
      });
    }

    const reply = payload.choices?.[0]?.message?.content?.trim() ?? "";

    if (!reply) {
      return jsonResponse(request, 502, { error: "Groq returned an empty response." });
    }

    return jsonResponse(request, 200, { reply });
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return jsonResponse(request, error.status, { error: error.message });
    }

    console.error("chat function failed", error);
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    return jsonResponse(request, 500, { error: localized.unavailable });
  }
});
