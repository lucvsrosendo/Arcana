export const MAX_MESSAGES = 10;
export const MAX_MESSAGE_LENGTH = 4_000;

export const languageName: Record<string, string> = {
  pt: "Portuguese (Brazil)",
  en: "English",
  es: "Spanish",
};

export const providerErrorMessages: Record<
  string,
  { missingKey: string; invalidKey: string; quota: string; rateLimit: string; unavailable: string }
> = {
  pt: {
    missingKey: "Configure GROQ_API_KEY no backend para ativar o chatbot.",
    invalidKey: "A chave da Groq parece invalida ou sem permissao.",
    quota:
      "A API da Groq respondeu que sua cota/credito acabou ou que o plano atual nao permite esta chamada.",
    rateLimit:
      "A API da Groq recebeu muitas chamadas em pouco tempo. Aguarde um instante e tente de novo.",
    unavailable:
      "A API da Groq nao respondeu corretamente agora. Tente novamente em instantes.",
  },
  en: {
    missingKey: "Configure GROQ_API_KEY on the backend to enable the chatbot.",
    invalidKey: "The Groq key appears to be invalid or missing permission.",
    quota:
      "The Groq API says your quota/credits are exhausted or the current plan does not allow this request.",
    rateLimit:
      "The Groq API received too many requests too quickly. Wait a moment and try again.",
    unavailable:
      "The Groq API did not respond correctly right now. Try again shortly.",
  },
  es: {
    missingKey: "Configura GROQ_API_KEY en el backend para activar el chatbot.",
    invalidKey: "La clave de Groq parece invalida o sin permiso.",
    quota:
      "La API de Groq indica que tu cuota/credito se agoto o que el plan actual no permite esta llamada.",
    rateLimit:
      "La API de Groq recibio demasiadas llamadas en poco tiempo. Espera un momento e intenta de nuevo.",
    unavailable:
      "La API de Groq no respondio correctamente ahora. Intenta de nuevo en breve.",
  },
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TarotChatContext = {
  language?: string;
  source?: string;
  question?: string;
  spread?: unknown;
  focusedCard?: unknown;
  readingProgress?: unknown;
  combinations?: unknown[];
  cards?: unknown[];
  draftNote?: string;
  manifestation?: string;
  deepMode?: boolean;
};

export const sanitizeMessages = (rawMessages: unknown): ChatMessage[] => {
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

export const getProviderErrorMessage = (
  status: number,
  providerMessage: string | undefined,
  language: string,
) => {
  const messages = providerErrorMessages[language] ?? providerErrorMessages.pt;
  const normalizedMessage = String(providerMessage ?? "").toLowerCase();

  if (status === 401 || status === 403) {
    return messages.invalidKey;
  }

  if (
    status === 429 &&
    (normalizedMessage.includes("quota") ||
      normalizedMessage.includes("billing") ||
      normalizedMessage.includes("credit"))
  ) {
    return messages.quota;
  }

  if (status === 429) {
    return messages.rateLimit;
  }

  return messages.unavailable;
};

export const buildInstructions = (language: string, context: TarotChatContext = {}) => {
  const lang = languageName[language] ?? languageName.pt;
  const isJournal = context.source === "tarot-journal";
  const hasFocus = Boolean(context.focusedCard);
  const hasCombinations = Array.isArray(context.combinations) && context.combinations.length > 0;

  const modeBlock = isJournal
    ? `Mode: Journal oracle.
- The user is writing in their tarot journal. Read draftNote and manifestation when provided.
- Offer a reflective vision that connects the linked reading with the journal draft.
- Keep the tone intimate and journaling-friendly.`
    : hasFocus
      ? `Mode: Focused card.
- Prioritize the focused card first, then relate it to neighboring revealed positions.
- Name positions explicitly when interpreting.`
      : `Mode: Spread reading.
- Interpret the revealed spread first; cite positions by name.
- Do not speculate about unrevealed cards listed in readingProgress.hiddenPositions.`;

  const combinationsBlock = hasCombinations
    ? `- Special combinations were detected in this reading. Mention them explicitly when relevant:
${context.combinations!.map((combo: { name?: string; description?: string }) => `  - ${combo.name}: ${combo.description}`).join("\n")}`
    : "";

  return `You are the Tarot Oracle inside a web app focused on tarot readings (Major and Minor Arcana).
Answer in ${lang}.

${modeBlock}
${combinationsBlock}

Style:
- Warm, symbolic, precise, and practical.
- Interpret the actual spread context first; do not give generic card blurbs.
- Never claim fixed destiny. Present tendencies, mirrors, and possible practices.
- Keep answers concise unless the user asks for depth.
- Use markdown sparingly: **bold** for card names, short bullet lists when helpful.

Safety:
- This is reflective and spiritual entertainment/support, not medical, legal, financial, or mental-health advice.`;
};

export const compactTarotContext = (context: TarotChatContext) =>
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

export const buildGroqMessages = (context: TarotChatContext, messages: ChatMessage[]) => {
  const history = messages.slice(0, -1);
  const latestUser = messages[messages.length - 1];
  const language = context.language ?? "pt";

  const groqMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    {
      role: "system",
      content: `${buildInstructions(language, context)}\n\nTarot context (ground truth):\n${compactTarotContext(context)}`,
    },
  ];

  history.forEach((message) => {
    groqMessages.push({ role: message.role, content: message.content });
  });

  groqMessages.push({ role: "user", content: latestUser.content });
  return groqMessages;
};

export const getChatModel = (context: TarotChatContext) => {
  if (context.deepMode) {
    return (
      Deno.env.get("GROQ_MODEL_DEEP") ??
      Deno.env.get("GROQ_MODEL") ??
      "llama-3.3-70b-versatile"
    );
  }

  return (
    Deno.env.get("GROQ_MODEL_FAST") ??
    Deno.env.get("GROQ_MODEL") ??
    "llama-3.1-8b-instant"
  );
};

export const getMaxTokens = (context: TarotChatContext) => (context.deepMode ? 1200 : 600);

export const isGroqConfigured = () => {
  const key = Deno.env.get("GROQ_API_KEY")?.trim();
  return Boolean(
    key && key !== "cole_sua_chave_groq_aqui" && key !== "gsk_your_groq_api_key",
  );
};

export const detectLanguage = (acceptLanguage: string | null) => {
  if (!acceptLanguage) {
    return "pt";
  }
  if (acceptLanguage.startsWith("es")) {
    return "es";
  }
  if (acceptLanguage.startsWith("en")) {
    return "en";
  }
  return "pt";
};

export type CardInsightPayload = {
  language?: string;
  question: string;
  spread: {
    id: string;
    title: string;
    description: string;
  };
  position: {
    title: string;
    prompt: string;
  };
  card: {
    name: string;
    number: number;
    reversed?: boolean;
    description: string;
    dailyAdvice?: string;
    meanings: Record<string, string>;
    positiveKeywords: string[];
    cautionKeywords: string[];
  };
  revealedSoFar?: Array<{
    position: string;
    cardName: string;
    reversed?: boolean;
  }>;
};

export const buildCardInsightInstructions = (language: string) => {
  const lang = languageName[language] ?? languageName.pt;

  return `You are the Tarot Oracle inside the Arcanos Maiores web app.
Answer in ${lang}.

The user asked a question for a tarot reading and revealed ONE card in ONE spread position.
Write exactly 1-2 short sentences connecting their question, the position name, and the card symbolism.
Personalize to their question; do not copy card text verbatim.
Warm, symbolic, practical tone. No bullet lists. No markdown.
Never claim fixed destiny.
This is reflective spiritual support, not medical, legal, financial, or mental-health advice.`;
};

export const buildCardInsightUserMessage = (payload: CardInsightPayload) =>
  JSON.stringify(
    {
      question: payload.question,
      spread: payload.spread,
      position: payload.position,
      card: payload.card,
      revealedSoFar: payload.revealedSoFar ?? [],
    },
    null,
    2,
  );

export const getCardInsightMaxTokens = () => 160;

export const getCardInsightModel = () =>
  Deno.env.get("GROQ_MODEL_FAST") ??
  Deno.env.get("GROQ_MODEL") ??
  "llama-3.1-8b-instant";
