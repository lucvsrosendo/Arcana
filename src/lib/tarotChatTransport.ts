import { DefaultChatTransport, type UIMessage } from "ai";
import type { TarotChatContext } from "./chatContext";

type TarotChatTransportState = {
  context: TarotChatContext;
  deepMode: boolean;
};

let transportState: TarotChatTransportState | null = null;

export const setTarotChatTransportState = (state: TarotChatTransportState) => {
  transportState = state;
};

const getMessageText = (message: UIMessage) =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");

const chatApiUrl =
  (import.meta.env.VITE_CHAT_API_URL as string | undefined)?.trim() || "/api/chat";

export const tarotChatTransport = new DefaultChatTransport({
  api: chatApiUrl,
  prepareSendMessagesRequest: ({ messages }) => {
    if (!transportState) {
      throw new Error("Tarot chat transport state is not initialized.");
    }

    const requestContext = {
      ...transportState.context,
      deepMode: transportState.deepMode,
    };

    return {
      body: {
        useAiSdk: true,
        context: requestContext,
        messages: messages
          .filter((message) => message.role === "user" || message.role === "assistant")
          .slice(-10)
          .map((message) => ({
            role: message.role,
            content: getMessageText(message),
          }))
          .filter((message) => message.content.trim().length > 0),
      },
    };
  },
});
