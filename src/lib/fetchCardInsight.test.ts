import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getLocalizedSpreadDefinition, localizeReadingSlots } from "../data/i18n";
import { majorArcana } from "../data/majorArcana";
import { buildCardInsightPayload } from "./cardInsight";
import { CardInsightError, fetchCardInsight } from "./fetchCardInsight";
import { createReadingFromSpread } from "./readings";

describe("fetchCardInsight", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns insight text from API", async () => {
    const spread = getLocalizedSpreadDefinition("three-card", "pt");
    const reading = localizeReadingSlots(
      createReadingFromSpread(spread, majorArcana),
      "three-card",
      "pt",
    );
    const payload = buildCardInsightPayload(
      "pt",
      "Devo mudar de emprego?",
      spread,
      reading[0],
      [],
    );

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ insight: "Resposta curta do oraculo." }),
    });

    await expect(fetchCardInsight(payload)).resolves.toBe("Resposta curta do oraculo.");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/interpret-card",
      expect.objectContaining({
        method: "POST",
      }),
    );
  });

  it("throws CardInsightError when API fails", async () => {
    const spread = getLocalizedSpreadDefinition("single", "pt");
    const reading = localizeReadingSlots(
      createReadingFromSpread(spread, majorArcana),
      "single",
      "pt",
    );
    const payload = buildCardInsightPayload(
      "pt",
      "Qual caminho seguir?",
      spread,
      reading[0],
      [],
    );

    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ error: "Rate limit" }),
    });

    await expect(fetchCardInsight(payload)).rejects.toBeInstanceOf(CardInsightError);
  });
});
