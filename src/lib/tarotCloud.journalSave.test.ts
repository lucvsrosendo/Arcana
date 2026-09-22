import { beforeEach, describe, expect, it, vi } from "vitest";

const upsertMock = vi.fn();

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: "user-1" } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "user_xp_events") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                maybeSingle: vi.fn(async () => ({ data: null, error: null })),
              })),
            })),
          })),
        };
      }

      return {
        upsert: upsertMock,
      };
    }),
    rpc: vi.fn(async () => ({
      data: null,
      error: { code: "PGRST202", message: "Could not find the function" },
    })),
  },
}));

describe("saveJournalEntryToCloud legacy schema", () => {
  beforeEach(() => {
    upsertMock.mockReset();
    vi.resetModules();
    const storage = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
    };
    vi.stubGlobal("localStorage", storage);
    vi.stubGlobal("sessionStorage", storage);
    vi.stubGlobal("window", {
      setTimeout: (fn: () => void) => {
        fn();
        return 0;
      },
    });
  });

  it("retries without tags when the column is missing", async () => {
    upsertMock
      .mockResolvedValueOnce({
        error: {
          message: "column tarot_journal_entries.tags does not exist",
        },
      })
      .mockResolvedValueOnce({ error: null });

    const { saveJournalEntryToCloud } = await import("./tarotCloud");

    await saveJournalEntryToCloud({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Nota",
      content: "Texto do diario",
      tags: ["lua"],
      createdAt: "2026-07-14T00:00:00.000Z",
    });

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(upsertMock.mock.calls[0][0]).toHaveProperty("tags");
    expect(upsertMock.mock.calls[1][0]).not.toHaveProperty("tags");
    expect(upsertMock.mock.calls[0][1]).toEqual({ onConflict: "id" });
    expect(upsertMock.mock.calls[1][0]).toMatchObject({
      title: "Nota",
      content: "Texto do diario",
      manifestation: null,
    });
  });

  it("retries without tags on PostgREST PGRST204 schema-cache error", async () => {
    upsertMock
      .mockResolvedValueOnce({
        error: {
          code: "PGRST204",
          message:
            "Could not find the 'tags' column of 'tarot_journal_entries' in the schema cache",
        },
      })
      .mockResolvedValueOnce({ error: null });

    const { saveJournalEntryToCloud } = await import("./tarotCloud");

    await saveJournalEntryToCloud({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Nota",
      content: "Texto do diario",
      tags: ["lua"],
      createdAt: "2026-07-14T00:00:00.000Z",
    });

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(upsertMock.mock.calls[1][0]).not.toHaveProperty("tags");
  });

  it("retries without linked_reading_id on foreign key violation", async () => {
    upsertMock
      .mockResolvedValueOnce({
        error: {
          code: "23503",
          message:
            'insert or update on table "tarot_journal_entries" violates foreign key constraint "tarot_journal_entries_linked_reading_id_fkey"',
        },
      })
      .mockResolvedValueOnce({ error: null });

    const { saveJournalEntryToCloud } = await import("./tarotCloud");

    await saveJournalEntryToCloud({
      id: "11111111-1111-4111-8111-111111111111",
      title: "Nota",
      content: "Texto do diario",
      tags: [],
      linkedReadingId: "33333333-3333-4333-8333-333333333333",
      createdAt: "2026-07-14T00:00:00.000Z",
    });

    expect(upsertMock).toHaveBeenCalledTimes(2);
    expect(upsertMock.mock.calls[0][0]).toMatchObject({
      linked_reading_id: "33333333-3333-4333-8333-333333333333",
    });
    expect(upsertMock.mock.calls[1][0]).toMatchObject({
      linked_reading_id: null,
    });
  });
});
