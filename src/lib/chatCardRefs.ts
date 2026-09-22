import type { ReadingSlot } from "../types/tarot";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type CardReference = {
  name: string;
  slotId: string;
};

export const getCardReferences = (reading: readonly ReadingSlot[]): CardReference[] =>
  reading.map((slot) => ({
    name: slot.card.name,
    slotId: slot.id,
  }));

export const linkifyCardNames = (
  content: string,
  references: readonly CardReference[],
): string => {
  let result = content;
  const sorted = [...references].sort((left, right) => right.name.length - left.name.length);

  sorted.forEach((reference) => {
    const regex = new RegExp(`(?<!\\[)\\b(${escapeRegExp(reference.name)})\\b(?!\\])`, "gi");
    result = result.replace(regex, `[$1](card:${reference.slotId})`);
  });

  return result;
};
