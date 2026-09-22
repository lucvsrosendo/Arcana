import { beforeEach, describe, expect, it, vi } from "vitest";

const ensureUserProfile = vi.fn(async () => null);
const fromMock = vi.fn();

vi.mock("./userProfileCloud", () => ({
  ensureUserProfile: () => ensureUserProfile(),
}));

vi.mock("./supabaseClient", () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

import {
  createComment,
  getCommentSaveErrorMessage,
  isMissingParentIdColumnError,
  normalizeCommentBody,
} from "./newsCommentsCloud";

const sampleRow = {
  id: "comment-1",
  news_id: "news-1",
  user_id: "user-1",
  parent_id: null as string | null,
  author_display_name: "Reader",
  body: "hello world",
  created_at: "2026-07-14T12:00:00.000Z",
  updated_at: "2026-07-14T12:00:00.000Z",
};

const makeInsertBuilder = (result: { data: unknown; error: unknown }) => {
  const builder = {
    insert: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(async () => result),
  };
  return builder;
};

const makeEnrichBuilder = (result: { data: unknown; error: unknown } = { data: [], error: null }) => {
  const builder = {
    select: vi.fn(() => builder),
    in: vi.fn(async () => result),
  };
  return builder;
};

describe("newsCommentsCloud helpers", () => {
  beforeEach(() => {
    fromMock.mockReset();
    ensureUserProfile.mockClear();
  });

  it("trims whitespace from comment bodies", () => {
    expect(normalizeCommentBody("  hello world  ")).toBe("hello world");
  });

  it("returns empty string for whitespace-only bodies", () => {
    expect(normalizeCommentBody("   \n\t  ")).toBe("");
  });

  it("caps comment length at 2000 characters", () => {
    const longBody = "a".repeat(2500);
    expect(normalizeCommentBody(longBody)).toHaveLength(2000);
    expect(normalizeCommentBody(longBody)).toBe("a".repeat(2000));
  });

  it("preserves emoji and unicode content within the limit", () => {
    const body = "🔮✨ ".repeat(400);
    const normalized = normalizeCommentBody(body);
    expect(normalized.length).toBeLessThanOrEqual(2000);
    expect(normalized.startsWith("🔮✨")).toBe(true);
  });

  it("maps RLS and auth failures to clear comment error codes", () => {
    expect(getCommentSaveErrorMessage(new Error("login-required"))).toBe("login-required");
    expect(
      getCommentSaveErrorMessage({
        code: "42501",
        message: "new row violates row-level security policy",
      }),
    ).toBe("comment-permission-denied");
    expect(getCommentSaveErrorMessage({ message: "JWT expired" })).toBe("login-required");
    expect(getCommentSaveErrorMessage({ message: "network" })).toBe("comment-save-error");
  });

  it("maps foreign-key and schema failures to dedicated codes", () => {
    expect(
      getCommentSaveErrorMessage({
        code: "23503",
        message: "insert or update on table violates foreign key constraint",
      }),
    ).toBe("comment-foreign-key");
    expect(
      getCommentSaveErrorMessage({
        code: "42703",
        message: 'column "parent_id" does not exist',
      }),
    ).toBe("comment-schema-error");
    expect(
      getCommentSaveErrorMessage({
        code: "PGRST204",
        message: "Could not find the 'parent_id' column of 'site_news_comments' in the schema cache",
      }),
    ).toBe("comment-schema-error");
    expect(
      isMissingParentIdColumnError({
        message: "Could not find the 'parent_id' column of 'site_news_comments' in the schema cache",
        code: "PGRST204",
      }),
    ).toBe(true);
  });

  it("returns the raw comment when enrich fails after a successful insert", async () => {
    const insertBuilder = makeInsertBuilder({ data: sampleRow, error: null });

    fromMock.mockImplementation((table: string) => {
      if (table === "site_news_comments") {
        return insertBuilder;
      }
      throw new Error("enrich boom");
    });

    const comment = await createComment("news-1", "hello world", "Reader", "user-1");

    expect(ensureUserProfile).toHaveBeenCalled();
    expect(comment.id).toBe("comment-1");
    expect(comment.body).toBe("hello world");
    expect(comment.likeCount).toBe(0);
  });

  it("retries insert without parent_id when that column is missing", async () => {
    const failingInsert = makeInsertBuilder({
      data: null,
      error: {
        code: "PGRST204",
        message: "Could not find the 'parent_id' column of 'site_news_comments' in the schema cache",
      },
    });
    const successInsert = makeInsertBuilder({
      data: { ...sampleRow, parent_id: null },
      error: null,
    });
    let commentInsertCalls = 0;

    fromMock.mockImplementation((table: string) => {
      if (table === "site_news_comments") {
        commentInsertCalls += 1;
        return commentInsertCalls === 1 ? failingInsert : successInsert;
      }
      return makeEnrichBuilder();
    });

    const comment = await createComment(
      "news-1",
      "reply body",
      "Reader",
      "user-1",
      "parent-missing-column",
    );

    expect(commentInsertCalls).toBe(2);
    expect(failingInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ parent_id: "parent-missing-column" }),
    );
    expect(successInsert.insert).toHaveBeenCalledWith(
      expect.not.objectContaining({ parent_id: expect.anything() }),
    );
    expect(comment.body).toBe("hello world");
  });
});
