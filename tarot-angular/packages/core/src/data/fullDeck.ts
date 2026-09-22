import { majorArcana } from "./majorArcana";
import { minorArcana } from "./minorArcana";
import type { DeckCard } from "../types/tarot";

export const fullDeck: DeckCard[] = [...majorArcana, ...minorArcana];

export const FULL_DECK_COUNT = fullDeck.length;

export const isFullDeck = () => FULL_DECK_COUNT === 78;
