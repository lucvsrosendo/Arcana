export type PasswordStrengthLevel = "weak" | "ok" | "strong";

export type PasswordStrength = {
  score: number;
  level: PasswordStrengthLevel;
};

export const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, level: "weak" };
  }

  let score = 0;

  if (password.length >= 8) {
    score += 25;
  }

  if (password.length >= 12) {
    score += 15;
  }

  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 20;
  } else if (/[a-z]/i.test(password)) {
    score += 10;
  }

  if (/\d/.test(password)) {
    score += 20;
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 20;
  }

  const normalizedScore = Math.min(100, score);
  let level: PasswordStrengthLevel = "weak";

  if (normalizedScore >= 70) {
    level = "strong";
  } else if (normalizedScore >= 40) {
    level = "ok";
  }

  return { score: normalizedScore, level };
};
