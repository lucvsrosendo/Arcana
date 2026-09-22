import { describe, expect, it } from "vitest";
import type { NewsComment } from "../data/siteNews";
import {
  canDeleteNewsComment,
  canEditNewsComment,
  canInteractWithNewsComment,
} from "./newsCommentPermissions";

const sampleComment: NewsComment = {
  id: "comment-1",
  newsId: "news-1",
  userId: "user-author",
  authorDisplayName: "Author",
  body: "Hello",
  createdAt: "2026-06-07T10:00:00.000Z",
  updatedAt: "2026-06-07T10:00:00.000Z",
  likeCount: 0,
  favoriteCount: 0,
  likedByCurrentUser: false,
  favoritedByCurrentUser: false,
};

describe("news comment permissions", () => {
  it("allows authors to edit their own comments", () => {
    expect(canEditNewsComment(sampleComment, "user-author")).toBe(true);
  });

  it("denies edit for other users and guests", () => {
    expect(canEditNewsComment(sampleComment, "user-other")).toBe(false);
    expect(canEditNewsComment(sampleComment, null)).toBe(false);
    expect(canEditNewsComment(sampleComment)).toBe(false);
  });

  it("allows authors to delete their own comments", () => {
    expect(canDeleteNewsComment(sampleComment, "user-author", false)).toBe(true);
  });

  it("allows editors to delete any comment", () => {
    expect(canDeleteNewsComment(sampleComment, "user-other", true)).toBe(true);
    expect(canDeleteNewsComment(sampleComment, null, true)).toBe(true);
  });

  it("denies delete for non-authors when not editor", () => {
    expect(canDeleteNewsComment(sampleComment, "user-other", false)).toBe(false);
    expect(canDeleteNewsComment(sampleComment, null, false)).toBe(false);
  });

  it("allows interactions only for other users comments", () => {
    expect(canInteractWithNewsComment(sampleComment, "user-other")).toBe(true);
    expect(canInteractWithNewsComment(sampleComment, "user-author")).toBe(false);
    expect(canInteractWithNewsComment(sampleComment, null)).toBe(false);
  });
});
