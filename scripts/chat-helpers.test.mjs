import { describe, expect, it } from "vitest";
import {
  buildGroqMessages,
  getProviderErrorMessage,
  sanitizeMessages,
} from "./chat-helpers.mjs";

describe("sanitizeMessages", () => {
  it("keeps valid roles and trims history length", () => {
    const messages = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: `message-${index}`,
    }));

    const sanitized = sanitizeMessages(messages);

    expect(sanitized).toHaveLength(10);
    expect(sanitized[0].content).toBe("message-2");
  });

  it("drops invalid entries", () => {
    const sanitized = sanitizeMessages([
      { role: "system", content: "ignore" },
      { role: "user", content: "  hello  " },
      { role: "assistant", content: "" },
    ]);

    expect(sanitized).toEqual([{ role: "user", content: "  hello  " }]);
  });
});

describe("getProviderErrorMessage", () => {
  it("maps auth errors", () => {
    expect(getProviderErrorMessage(401, "invalid", "pt")).toContain("invalida");
  });

  it("maps quota errors", () => {
    expect(getProviderErrorMessage(429, "quota exceeded", "en")).toContain("quota");
  });
});

describe("buildGroqMessages", () => {
  it("creates alternating history with a clean latest user turn", () => {
    const messages = buildGroqMessages(
      {
        language: "pt",
        spread: { id: "three-card", title: "Tres cartas", description: "desc" },
        cards: [],
      },
      [
        { role: "user", content: "Primeira pergunta" },
        { role: "assistant", content: "Primeira resposta" },
        { role: "user", content: "Segunda pergunta" },
      ],
    );

    expect(messages[0].role).toBe("system");
    expect(messages[1]).toEqual({ role: "user", content: "Primeira pergunta" });
    expect(messages[2]).toEqual({ role: "assistant", content: "Primeira resposta" });
    expect(messages[3]).toEqual({ role: "user", content: "Segunda pergunta" });
  });
});
