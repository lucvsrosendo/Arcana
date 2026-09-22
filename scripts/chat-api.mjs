import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  buildCardInsightInstructions,
  buildCardInsightUserMessage,
  buildGroqMessages,
  getCardInsightMaxTokens,
  getCardInsightModel,
  getChatModel,
  getMaxTokens,
  getProviderErrorMessage,
  providerErrorMessages,
  sanitizeMessages,
} from "./chat-helpers.mjs";

const loadEnvFile = (filename) => {
  const filePath = resolve(filename);
  if (!existsSync(filePath)) {
    return;
  }

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnvFile(".env");
loadEnvFile(".env.local");

const readJsonBody = (request) =>
  new Promise((resolveBody, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 120_000) {
        reject(new Error("Payload too large"));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolveBody(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });

    request.on("error", reject);
  });

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(JSON.stringify(payload));
};

const detectLanguage = (request) => {
  const header = request.headers["accept-language"];
  if (typeof header !== "string") {
    return "pt";
  }
  if (header.startsWith("es")) {
    return "es";
  }
  if (header.startsWith("en")) {
    return "en";
  }
  return "pt";
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const RATE_LIMIT_FILE = resolve(".cache", "chat-rate-limit.json");
const rateLimitBuckets = new Map();

const loadRateLimitBuckets = () => {
  try {
    if (!existsSync(RATE_LIMIT_FILE)) {
      return;
    }
    const raw = readFileSync(RATE_LIMIT_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return;
    }

    parsed.forEach((item) => {
      if (
        Array.isArray(item) &&
        typeof item[0] === "string" &&
        item[1] &&
        typeof item[1].count === "number" &&
        typeof item[1].resetAt === "number"
      ) {
        rateLimitBuckets.set(item[0], item[1]);
      }
    });
  } catch {
    // Ignore malformed cache.
  }
};

const persistRateLimitBuckets = () => {
  try {
    mkdirSync(resolve(".cache"), { recursive: true });
    const now = Date.now();
    const snapshot = Array.from(rateLimitBuckets.entries()).filter(
      ([, bucket]) => now <= bucket.resetAt,
    );
    writeFileSync(RATE_LIMIT_FILE, JSON.stringify(snapshot), "utf8");
  } catch {
    // Ignore file persistence issues.
  }
};

loadRateLimitBuckets();

const getClientKey = (request) => {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return request.socket?.remoteAddress ?? "unknown";
};

const isRateLimited = (request) => {
  const now = Date.now();

  if (rateLimitBuckets.size > 1_000) {
    for (const [key, bucket] of rateLimitBuckets) {
      if (now > bucket.resetAt) {
        rateLimitBuckets.delete(key);
      }
    }
  }

  const clientKey = getClientKey(request);
  const bucket = rateLimitBuckets.get(clientKey);

  if (!bucket || now > bucket.resetAt) {
    rateLimitBuckets.set(clientKey, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    persistRateLimitBuckets();
    return false;
  }

  bucket.count += 1;
  persistRateLimitBuckets();
  return bucket.count > RATE_LIMIT_MAX_REQUESTS;
};

const extractOutputText = (payload) => {
  const choiceContent = payload.choices?.[0]?.message?.content;

  if (typeof choiceContent === "string" && choiceContent.trim()) {
    return choiceContent.trim();
  }

  return "";
};

const isGroqConfigured = () => {
  const key = process.env.GROQ_API_KEY?.trim();

  return Boolean(
    key &&
      key !== "cole_sua_chave_groq_aqui" &&
      key !== "gsk_your_groq_api_key",
  );
};

const requestGroqReply = async (groqMessages, context) => {
  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
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
    return {
      ok: false,
      status: groqResponse.status,
      error: getProviderErrorMessage(
        groqResponse.status,
        payload.error?.message,
        context.language,
      ),
    };
  }

  const reply = extractOutputText(payload);

  if (!reply) {
    return {
      ok: false,
      status: 502,
      error: "Groq returned an empty response.",
    };
  }

  return { ok: true, reply };
};

const streamAiSdkReply = async (groqMessages, context, response) => {
  try {
    const { streamText } = await import("ai");
    const { createGroq } = await import("@ai-sdk/groq");

    const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
    const systemMessage = groqMessages.find((message) => message.role === "system");
    const otherMessages = groqMessages.filter((message) => message.role !== "system");

    const result = streamText({
      model: groq(getChatModel(context)),
      system: systemMessage?.content,
      messages: otherMessages,
      maxOutputTokens: getMaxTokens(context),
      temperature: 0.7,
    });

    result.pipeUIMessageStreamToResponse(response, {
      headers: {
        "Cache-Control": "no-cache, no-transform",
        "X-Content-Type-Options": "nosniff",
      },
    });

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : "AI SDK stream failed.",
    };
  }
};

const streamGroqReply = async (groqMessages, context, response) => {
  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: getChatModel(context),
      messages: groqMessages,
      max_tokens: getMaxTokens(context),
      temperature: 0.7,
      stream: true,
    }),
  });

  if (!groqResponse.ok) {
    const payload = await groqResponse.json().catch(() => ({}));
    return {
      ok: false,
      status: groqResponse.status,
      error: getProviderErrorMessage(
        groqResponse.status,
        payload.error?.message,
        context.language,
      ),
    };
  }

  if (!groqResponse.body) {
    return {
      ok: false,
      status: 502,
      error: "Groq returned an empty stream.",
    };
  }

  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Content-Type-Options": "nosniff",
  });

  const reader = groqResponse.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let hasContent = false;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed.startsWith("data:")) {
        continue;
      }

      const data = trimmed.slice(5).trim();

      if (!data) {
        continue;
      }

      if (data === "[DONE]") {
        response.write("data: [DONE]\n\n");
        continue;
      }

      try {
        const payload = JSON.parse(data);
        const delta = payload.choices?.[0]?.delta?.content;

        if (typeof delta === "string" && delta.length > 0) {
          hasContent = true;
          response.write(`data: ${JSON.stringify({ text: delta })}\n\n`);
        }
      } catch {
        // Ignore malformed stream chunks.
      }
    }
  }

  response.end();

  if (!hasContent) {
    return {
      ok: false,
      status: 502,
      error: "Groq returned an empty response.",
    };
  }

  return { ok: true };
};

export const handleChatRequest = async (request, response) => {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const headerLanguage = detectLanguage(request);

  if (isRateLimited(request)) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    sendJson(response, 429, { error: localized.rateLimit });
    return;
  }

  if (!isGroqConfigured()) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;

    sendJson(response, 503, {
      error: localized.missingKey,
    });
    return;
  }

  try {
    const body = await readJsonBody(request);
    const context = body.context ?? {};
    const messages = sanitizeMessages(body.messages);
    const userMessage = messages[messages.length - 1]?.content;

    if (typeof userMessage !== "string" || !userMessage.trim()) {
      sendJson(response, 400, { error: "Missing user message." });
      return;
    }

    const groqMessages = buildGroqMessages(context, messages);

    if (body.useAiSdk === true) {
      const result = await streamAiSdkReply(groqMessages, context, response);

      if (!result.ok) {
        if (!response.headersSent) {
          sendJson(response, result.status, { error: result.error });
        }
      }

      return;
    }

    if (body.stream === true) {
      const result = await streamGroqReply(groqMessages, context, response);

      if (!result.ok) {
        if (!response.headersSent) {
          sendJson(response, result.status, { error: result.error });
        }
      }

      return;
    }

    const result = await requestGroqReply(groqMessages, context);

    if (!result.ok) {
      sendJson(response, result.status, { error: result.error });
      return;
    }

    sendJson(response, 200, { reply: result.reply });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unexpected chat error.",
    });
  }
};

const isValidCardInsightPayload = (payload) =>
  payload &&
  typeof payload.question === "string" &&
  payload.question.trim().length > 0 &&
  payload.spread &&
  payload.position &&
  payload.card &&
  typeof payload.card.name === "string";

export const handleCardInsightRequest = async (request, response) => {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  const headerLanguage = detectLanguage(request);

  if (isRateLimited(request)) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    sendJson(response, 429, { error: localized.rateLimit });
    return;
  }

  if (!isGroqConfigured()) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    sendJson(response, 503, { error: localized.missingKey });
    return;
  }

  try {
    const payload = await readJsonBody(request);

    if (!isValidCardInsightPayload(payload)) {
      sendJson(response, 400, { error: "Missing or invalid card insight payload." });
      return;
    }

    const language = payload.language ?? headerLanguage;
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
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
      sendJson(response, groqResponse.status, {
        error: getProviderErrorMessage(
          groqResponse.status,
          groqPayload.error?.message,
          language,
        ),
      });
      return;
    }

    const insight = groqPayload.choices?.[0]?.message?.content?.trim() ?? "";

    if (!insight) {
      sendJson(response, 502, { error: "Groq returned an empty response." });
      return;
    }

    sendJson(response, 200, { insight });
  } catch (error) {
    sendJson(response, 500, {
      error: error instanceof Error ? error.message : "Unexpected card insight error.",
    });
  }
};
