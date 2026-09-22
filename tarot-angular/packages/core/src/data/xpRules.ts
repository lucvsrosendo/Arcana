export const XP_RULES = {
  commentCreated: 15,
  likeGiven: 3,
  likeReceived: 6,
  favoriteGiven: 4,
  favoriteReceived: 12,
  articleReadComplete: 10,
  readingSaved: 8,
  journalEntry: 12,
} as const;

/** Visual bar scale (no levels) — fills up to this XP amount */
export const XP_BAR_SCALE = 500;

export const getXpBarProgress = (xpTotal: number) =>
  Math.min(100, Math.round((Math.max(0, xpTotal) / XP_BAR_SCALE) * 100));

export type XpLevelId = "reader" | "sage" | "oracle";

export type XpLevel = {
  id: XpLevelId;
  label: string;
  minXp: number;
};

export const XP_LEVELS: XpLevel[] = [
  { id: "reader", label: "Reader", minXp: 0 },
  { id: "sage", label: "Sage", minXp: 150 },
  { id: "oracle", label: "Oracle", minXp: 400 },
];

export const getXpLevel = (xpTotal: number): XpLevel => {
  const sorted = [...XP_LEVELS].sort((a, b) => b.minXp - a.minXp);
  return sorted.find((level) => xpTotal >= level.minXp) ?? XP_LEVELS[0];
};

export const getNextXpLevel = (xpTotal: number): XpLevel | null => {
  const current = getXpLevel(xpTotal);
  const currentIndex = XP_LEVELS.findIndex((level) => level.id === current.id);
  return XP_LEVELS[currentIndex + 1] ?? null;
};
