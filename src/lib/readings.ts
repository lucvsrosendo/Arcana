import { majorArcana } from "../data/majorArcana";
import { getSpreadDefinition } from "../data/spreads";
import type { ReadingSlot, SpreadDefinition, SpreadId, TarotCard } from "../types/tarot";
import { shuffleDeck } from "./shuffleDeck";

export const createReadingFromSpread = (
  spread: SpreadDefinition,
  deck: readonly TarotCard[] = shuffleDeck(majorArcana),
  options?: {
    enableReversals?: boolean;
  },
): ReadingSlot[] =>
  spread.positions.map((position, index) => ({
    id: `${position.id}-${index}`,
    position,
    card: deck[index],
    reversed: options?.enableReversals ? Math.random() < 0.5 : false,
  }));

export const createReadingBySpreadId = (spreadId: SpreadId) =>
  createReadingFromSpread(getSpreadDefinition(spreadId), shuffleDeck(majorArcana));

export const getTodayKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getDailyCard = (date = new Date()) => {
  const key = getTodayKey(date);
  const seed = key.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  return majorArcana[seed % majorArcana.length];
};
