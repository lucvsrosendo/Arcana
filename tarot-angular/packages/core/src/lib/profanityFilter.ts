import { Filter } from "bad-words";

const filter = new Filter();

export const containsProfanity = (text: string) => {
  const normalized = text.trim();
  if (!normalized) {
    return false;
  }

  return filter.isProfane(normalized);
};

export const cleanProfanity = (text: string) => filter.clean(text);
