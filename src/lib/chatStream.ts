export { useCompletion } from "@ai-sdk/react";

type ChatStreamPayload = {
  context: unknown;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
};

export const streamChatReply = async (
  payload: ChatStreamPayload,
  onDelta: (text: string) => void,
): Promise<string> => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...payload,
      stream: true,
    }),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Chat request failed.");
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream") || !response.body) {
    const data = (await response.json()) as { reply?: string; error?: string };
    const reply = data.reply?.trim();

    if (!reply) {
      throw new Error(data.error ?? "Chat request failed.");
    }

    onDelta(reply);
    return reply;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

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

      if (!data || data === "[DONE]") {
        continue;
      }

      try {
        const parsed = JSON.parse(data) as { text?: string; error?: string };

        if (parsed.error) {
          throw new Error(parsed.error);
        }

        if (parsed.text) {
          fullText += parsed.text;
          onDelta(fullText);
        }
      } catch (error) {
        if (error instanceof Error && error.message !== "Unexpected end of JSON input") {
          throw error;
        }
      }
    }
  }

  if (!fullText.trim()) {
    throw new Error("Empty chat response.");
  }

  return fullText;
};
