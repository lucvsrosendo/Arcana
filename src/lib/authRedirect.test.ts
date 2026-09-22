import { describe, expect, it, afterEach, vi } from "vitest";
import {
  getAuthRedirectUrl,
  getOAuthCallbackUrl,
  isOAuthProviderDisabledError,
} from "./authRedirect";

describe("isOAuthProviderDisabledError", () => {
  it("detects disabled provider messages from Supabase", () => {
    expect(
      isOAuthProviderDisabledError("Unsupported provider: provider is not enabled"),
    ).toBe(true);
    expect(isOAuthProviderDisabledError("Provider is not enabled")).toBe(true);
  });

  it("ignores unrelated auth errors", () => {
    expect(isOAuthProviderDisabledError("Invalid login credentials")).toBe(false);
  });
});

describe("OAuth redirect URLs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers the live window origin over VITE_SITE_URL", () => {
    vi.stubGlobal("window", {
      location: { origin: "http://127.0.0.1:5176" },
    });

    expect(getAuthRedirectUrl()).toBe("http://127.0.0.1:5176");
    expect(getOAuthCallbackUrl()).toBe("http://127.0.0.1:5176/auth/callback");
  });
});
