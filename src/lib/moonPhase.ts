import { Moon } from "lunarphase-js";
import type { LanguageCode } from "../types/tarot";

const phaseLabels: Record<LanguageCode, Record<string, string>> = {
  pt: {
    "New Moon": "Lua Nova",
    "Waxing Crescent": "Lua Crescente",
    "First Quarter": "Quarto Crescente",
    "Waxing Gibbous": "Lua Gibosa Crescente",
    "Full Moon": "Lua Cheia",
    "Waning Gibbous": "Lua Gibosa Minguante",
    "Last Quarter": "Quarto Minguante",
    "Waning Crescent": "Lua Minguante",
  },
  en: {
    "New Moon": "New Moon",
    "Waxing Crescent": "Waxing Crescent",
    "First Quarter": "First Quarter",
    "Waxing Gibbous": "Waxing Gibbous",
    "Full Moon": "Full Moon",
    "Waning Gibbous": "Waning Gibbous",
    "Last Quarter": "Last Quarter",
    "Waning Crescent": "Waning Crescent",
  },
  es: {
    "New Moon": "Luna Nueva",
    "Waxing Crescent": "Luna Creciente",
    "First Quarter": "Cuarto Creciente",
    "Waxing Gibbous": "Luna Gibosa Creciente",
    "Full Moon": "Luna Llena",
    "Waning Gibbous": "Luna Gibosa Menguante",
    "Last Quarter": "Cuarto Menguante",
    "Waning Crescent": "Luna Menguante",
  },
};

export const getMoonPhaseLabel = (language: LanguageCode = "pt") => {
  const english = Moon.lunarPhase();
  return phaseLabels[language][english] ?? english;
};

export const getMoonPhaseEmoji = () => Moon.lunarPhaseEmoji();

export const isMoonWaxing = () => Moon.isWaxing();
