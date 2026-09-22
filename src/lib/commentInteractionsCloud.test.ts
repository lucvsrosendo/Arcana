import { describe, expect, it } from "vitest";
import { isSelfInteractionError } from "./commentInteractionsCloud";

describe("commentInteractionsCloud helpers", () => {
  it("detects self-interaction errors from Supabase messages", () => {
    expect(isSelfInteractionError(new Error("self-interaction-blocked"))).toBe(true);
    expect(isSelfInteractionError(new Error("SELF-INTERACTION-BLOCKED"))).toBe(true);
    expect(isSelfInteractionError(new Error("login-required"))).toBe(false);
    expect(isSelfInteractionError("self-interaction-blocked")).toBe(false);
  });
});
