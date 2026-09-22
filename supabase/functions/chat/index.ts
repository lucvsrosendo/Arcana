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

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  Vary: "Origin",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, accept-language",
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
    const context = (body.context ?? { language: headerLanguage }) as TarotChatContext;
    const messages = sanitizeMessages(body.messages);
    const userMessage = messages[messages.length - 1]?.content;

    if (typeof userMessage !== "string" || !userMessage.trim()) {
      return jsonResponse(400, { error: "Missing user message." });
    }

    let groqMessages = buildGroqMessages(context, messages);

    if (body.enableWebSearch === true && typeof userMessage === "string") {
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

    if (body.useAiSdk === true) {
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
          ...corsHeaders,
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
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
      return jsonResponse(groqResponse.status, {
        error: getProviderErrorMessage(
          groqResponse.status,
          payload.error?.message,
          headerLanguage,
        ),
      });
    }

    const reply = payload.choices?.[0]?.message?.content?.trim() ?? "";

    if (!reply) {
      return jsonResponse(502, { error: "Groq returned an empty response." });
    }

    return jsonResponse(200, { reply });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : "Unexpected chat error.",
    });
  }
});
