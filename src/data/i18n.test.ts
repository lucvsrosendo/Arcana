import { describe, expect, it } from "vitest";
import { majorArcana } from "./majorArcana";
import {
  getLocalizedSpreadDefinition,
  languageOptions,
  localizeCard,
  uiCopy,
} from "./i18n";

describe("i18n data", () => {
  it("keeps uiCopy keys aligned across languages", () => {
    const baseKeys = Object.keys(uiCopy.pt).sort();

    for (const { id } of languageOptions) {
      expect(Object.keys(uiCopy[id]).sort()).toEqual(baseKeys);
    }
  });

  it("localizes card names by language", () => {
    const baseCard = majorArcana.find((card) => card.id === "the-fool");
    expect(baseCard).toBeDefined();

    const ptCard = localizeCard(baseCard!, "pt");
    const enCard = localizeCard(baseCard!, "en");
    const esCard = localizeCard(baseCard!, "es");

    expect(ptCard.name).toBe("O Louco");
    expect(enCard.name).toBe("The Fool");
    expect(esCard.name).toBe("El Loco");
  });

  it("provides localized labels for daily advice spread", () => {
    const ptSpread = getLocalizedSpreadDefinition("daily-advice", "pt");
    const enSpread = getLocalizedSpreadDefinition("daily-advice", "en");

    expect(ptSpread.title).toBe("Conselho do dia");
    expect(enSpread.title).toBe("Daily advice");
    expect(ptSpread.positions[0]?.title).toBe("Conselho");
    expect(enSpread.positions[0]?.title).toBe("Advice");
  });
});
