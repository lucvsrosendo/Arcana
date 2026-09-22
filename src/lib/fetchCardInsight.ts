import type { CardInsightPayload } from "./cardInsight";

const cardInsightApiUrl =
  (import.meta.env.VITE_CARD_INSIGHT_API_URL as string | undefined)?.trim() ||
  "/api/interpret-card";

export class CardInsightError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "CardInsightError";
    this.status = status;
  }
}

export const fetchCardInsight = async (
  payload: CardInsightPayload,
  signal?: AbortSignal,
): Promise<string> => {
  const response = await fetch(cardInsightApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": payload.language,
    },
    body: JSON.stringify(payload),
    signal,
  });

  const body = (await response.json().catch(() => ({}))) as {
    insight?: string;
    error?: string;
  };

  if (!response.ok) {
    throw new CardInsightError(
      body.error ?? "Card insight request failed.",
      response.status,
    );
  }

  const insight = body.insight?.trim();

  if (!insight) {
    throw new CardInsightError("Card insight request returned empty text.", 502);
  }

  return insight;
};
