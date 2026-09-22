import { beforeEach, describe, expect, it, vi } from "vitest";

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("./supabaseClient", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    rpc: (...args: unknown[]) => rpcMock(...args),
  },
}));

import { fetchRecentXpEvents, fetchUserProfile } from "./userProfileCloud";

describe("userProfileCloud XP schema resilience", () => {
  beforeEach(() => {
    fromMock.mockReset();
    rpcMock.mockReset();
  });

  it("returns empty XP events when user_xp_events table is missing", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: async () => ({
              data: null,
              error: {
                code: "PGRST205",
                message: "Could not find the table 'public.user_xp_events' in the schema cache",
              },
            }),
          }),
        }),
      }),
    });

    await expect(fetchRecentXpEvents("user-1")).resolves.toEqual([]);
  });

  it("returns null profile when user_profiles table is missing", async () => {
    fromMock.mockReturnValue({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: {
              code: "PGRST205",
              message: "Could not find the table 'public.user_profiles' in the schema cache",
            },
          }),
        }),
      }),
    });

    await expect(fetchUserProfile("user-1")).resolves.toBeNull();
  });
});
