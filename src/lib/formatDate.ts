import { format, formatDistanceToNow } from "date-fns";
import { enUS, es, ptBR } from "date-fns/locale";
import type { LanguageCode } from "../types/tarot";

const localeMap = {
  pt: ptBR,
  en: enUS,
  es,
} satisfies Record<LanguageCode, Locale>;

type Locale = typeof ptBR;

export const formatAppDate = (
  value: string | Date,
  language: LanguageCode,
  pattern = "PP",
) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return format(date, pattern, { locale: localeMap[language] });
};

export const formatRelativeDate = (value: string | Date, language: LanguageCode) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return formatDistanceToNow(date, { addSuffix: true, locale: localeMap[language] });
};
