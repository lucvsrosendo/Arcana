import { describe, expect, it } from "vitest";
import { getPasswordStrength } from "./passwordStrength";

describe("getPasswordStrength", () => {
  it("returns zero score for empty password", () => {
    expect(getPasswordStrength("")).toEqual({ score: 0, level: "weak" });
  });

  it("marks short simple passwords as weak", () => {
    const result = getPasswordStrength("abc");
    expect(result.level).toBe("weak");
    expect(result.score).toBeLessThan(40);
  });

  it("marks policy-compliant passwords as ok or better", () => {
    const result = getPasswordStrength("Senha123");
    expect(result.level).not.toBe("weak");
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it("marks long mixed passwords as strong", () => {
    const result = getPasswordStrength("Senha-Forte-2026!");
    expect(result.level).toBe("strong");
    expect(result.score).toBeGreaterThanOrEqual(70);
  });
});
