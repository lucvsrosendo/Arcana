import { useChat } from "@ai-sdk/react";
import { type UIMessage } from "ai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TarotChatContext } from "../lib/chatContext";
import { setTarotChatTransportState, tarotChatTransport } from "../lib/tarotChatTransport";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const getMessageText = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

const toUiMessage = (message: ChatMessage): UIMessage => ({
  id: message.id,
  role: message.role,
  parts: [{ type: "text", text: message.content }],
});

const hashContextValue = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
};

export const useTarotChat = (
  context: TarotChatContext,
  errorMessage: string,
  onQuestionChanged?: () => void,
) => {
  const [deepMode, setDeepMode] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const previousQuestionRef = useRef(context.question ?? "");

  useEffect(() => {
    setTarotChatTransportState({ context, deepMode });
  }, [context, deepMode]);

  const contextKey = useMemo(
    () =>
      JSON.stringify({
        spread: context.spread.id,
        cards: context.cards.map((card) => `${card.position}:${card.cardName}`),
        question: context.question ? hashContextValue(context.question) : "",
        focus: context.focusedCard?.cardName ?? "",
      }),
    [context],
  );
  const storageKey = `tarot:chat:${btoa(unescape(encodeURIComponent(contextKey))).slice(0, 64)}`;

  const handleChatError = useCallback(
    (error: Error) => {
      setRequestError(error.message || errorMessage);
    },
    [errorMessage],
  );

  const handleChatFinish = useCallback(() => {
    setRequestError(null);
  }, []);

  const {
    messages: uiMessages,
    setMessages,
    status,
    error: chatError,
    sendMessage: chatSendMessage,
    regenerate,
    clearError,
  } = useChat({
    transport: tarotChatTransport,
    onError: handleChatError,
    onFinish: handleChatFinish,
  });

  const messages = useMemo(
    () =>
      uiMessages
        .filter((message) => message.role === "user" || message.role === "assistant")
        .map((message) => ({
          id: message.id,
          role: message.role as "user" | "assistant",
          content: getMessageText(message),
        })),
    [uiMessages],
  );

  const isLoading = status === "submitted" || status === "streaming";
  const error = requestError ?? chatError?.message ?? null;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      const parsed = saved ? (JSON.parse(saved) as ChatMessage[]) : [];
      setMessages(parsed.map(toUiMessage));
    } catch (error) {
      console.warn("Failed to restore chat history", error);
      setMessages([]);
    }
    setRequestError(null);
    clearError();
  }, [clearError, setMessages, storageKey]);

  useEffect(() => {
    if (
      previousQuestionRef.current &&
      context.question &&
      previousQuestionRef.current !== context.question &&
      messages.length > 0
    ) {
      onQuestionChanged?.();
    }

    previousQuestionRef.current = context.question ?? "";
  }, [context.question, messages.length, onQuestionChanged]);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const persist = () => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
      } catch {
        // Ignore storage limits or private mode errors.
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(persist, { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = window.setTimeout(persist, 0);
    return () => window.clearTimeout(timeoutId);
  }, [messages, status, storageKey]);

  const sendMessage = async (content: string, options?: { deepMode?: boolean }) => {
    const trimmedContent = content.trim();
    if (!trimmedContent || isLoading) {
      return;
    }

    setTarotChatTransportState({
      context,
      deepMode: options?.deepMode !== undefined ? options.deepMode : deepMode,
    });

    setRequestError(null);
    clearError();

    await chatSendMessage({ text: trimmedContent });
  };

  const retryLastMessage = async () => {
    if (isLoading) {
      return;
    }

    const lastUser = [...messages].reverse().find((message) => message.role === "user");

    if (!lastUser) {
      return;
    }

    setTarotChatTransportState({ context, deepMode });
    setRequestError(null);
    clearError();
    await regenerate();
  };

  const clearMessages = () => {
    setMessages([]);
    setRequestError(null);
    clearError();
  };

  return {
    contextKey,
    messages,
    isLoading,
    error,
    deepMode,
    setDeepMode,
    sendMessage,
    retryLastMessage,
    clearMessages,
  };
};
