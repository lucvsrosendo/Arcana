const WORDS_PER_MINUTE = 200;

export const estimateReadingMinutes = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    return 1;
  }

  const words = trimmed.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};
