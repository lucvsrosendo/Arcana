import { defineEventHandler, readBody, setResponseStatus } from "h3";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import type { TarotChatContext } from "@tarot/core";

const compactTarotContext = (context: TarotChatContext) =>
  JSON.stringify(
    {
      language: context.language,
      source: context.source,
      question: context.question,
      spread: context.spread,
      focusedCard: context.focusedCard,
      readingProgress: context.readingProgress,
      combinations: context.combinations,
      cards: context.cards,
      draftNote: context.draftNote,
      manifestation: context.manifestation,
    },
    null,
    2,
  );

const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 4_000;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const languageName = {
  pt: "Portuguese (Brazil)",
  en: "English",
  es: "Spanish",
} as const;

const providerErrorMessages = {
  pt: {
    missingKey: "Configure GROQ_API_KEY no backend para ativar o chatbot.",
    rateLimit: "Muitas chamadas em pouco tempo. Aguarde e tente novamente.",
  },
  en: {
    missingKey: "Configure GROQ_API_KEY on the backend to enable the chatbot.",
    rateLimit: "Too many requests. Wait a moment and try again.",
  },
  es: {
    missingKey: "Configura GROQ_API_KEY en el backend para activar el chatbot.",
    rateLimit: "Demasiadas llamadas en poco tiempo. Espera e intenta de nuevo.",
  },
} as const;

const sanitizeMessages = (rawMessages: unknown): ChatMessage[] => {
  if (!Array.isArray(rawMessages)) {
    return [];
  }

  return rawMessages
    .filter(
      (message) =>
        message &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    )
    .slice(-MAX_MESSAGES)
    .map((message) => ({
      role: message.role,
      content: message.content.slice(0, MAX_MESSAGE_LENGTH),
    }));
};

const buildInstructions = (language: keyof typeof languageName, context: TarotChatContext) => {
  const lang = languageName[language] ?? languageName.pt;
  const isJournal = context.source === "tarot-journal";
  const hasFocus = Boolean(context.focusedCard);

  const modeBlock = isJournal
    ? "Mode: Journal oracle."
    : hasFocus
      ? "Mode: Focused card."
      : "Mode: Spread reading.";

  return `You are the Tarot Oracle inside a web app focused on the 22 Major Arcana.
Answer in ${lang}.
${modeBlock}
Style: warm, symbolic, precise, and practical.`;
};

const buildGroqMessages = (context: TarotChatContext, messages: ChatMessage[]) => {
  const history = messages.slice(0, -1);
  const latestUser = messages[messages.length - 1];

  const groqMessages = [
    {
      role: "system" as const,
      content: `${buildInstructions(context.language, context)}\n\nTarot context (ground truth):\n${compactTarotContext(context)}`,
    },
  ];

  history.forEach((message) => {
    groqMessages.push({ role: message.role, content: message.content });
  });

  groqMessages.push({ role: "user", content: latestUser.content });
  return groqMessages;
};

const getChatModel = (context: TarotChatContext & { deepMode?: boolean }) => {
  if (context.deepMode) {
    return process.env.GROQ_MODEL_DEEP ?? process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  }

  return process.env.GROQ_MODEL_FAST ?? process.env.GROQ_MODEL ?? "llama-3.1-8b-instant";
};

const getMaxTokens = (context: TarotChatContext & { deepMode?: boolean }) =>
  context.deepMode ? 1200 : 600;

const isGroqConfigured = () => {
  const key = process.env.GROQ_API_KEY?.trim();
  return Boolean(
    key && key !== "cole_sua_chave_groq_aqui" && key !== "gsk_your_groq_api_key",
  );
};

const detectLanguage = (acceptLanguage: string | undefined) => {
  if (!acceptLanguage) {
    return "pt" as const;
  }

  if (acceptLanguage.startsWith("es")) {
    return "es" as const;
  }

  if (acceptLanguage.startsWith("en")) {
    return "en" as const;
  }

  return "pt" as const;
};

export default defineEventHandler(async (event) => {
  const headerLanguage = detectLanguage(event.node.req.headers["accept-language"]);

  if (!isGroqConfigured()) {
    const localized = providerErrorMessages[headerLanguage] ?? providerErrorMessages.pt;
    setResponseStatus(event, 503);
    return { error: localized.missingKey };
  }

  try {
    const body = await readBody<{
      context?: TarotChatContext;
      messages?: ChatMessage[];
      useAiSdk?: boolean;
      stream?: boolean;
    }>(event);

    const context = body.context ?? ({ language: headerLanguage } as TarotChatContext);
    const messages = sanitizeMessages(body.messages);
    const userMessage = messages[messages.length - 1]?.content;

    if (typeof userMessage !== "string" || !userMessage.trim()) {
      setResponseStatus(event, 400);
      return { error: "Missing user message." };
    }

    const groqMessages = buildGroqMessages(context, messages);

    if (body.useAiSdk === true) {
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

      return result.pipeUIMessageStreamToResponse(event.node.res, {
        headers: {
          "Cache-Control": "no-cache, no-transform",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    setResponseStatus(event, 400);
    return { error: "useAiSdk must be true for streaming chat." };
  } catch (error) {
    setResponseStatus(event, 500);
    return {
      error: error instanceof Error ? error.message : "Unexpected chat error.",
    };
  }
});
