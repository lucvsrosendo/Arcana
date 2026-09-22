import type { NewsComment } from "../data/siteNews";

export const canEditNewsComment = (
  comment: NewsComment,
  userId?: string | null,
): boolean => Boolean(userId && comment.userId === userId);

export const canDeleteNewsComment = (
  comment: NewsComment,
  userId?: string | null,
  isEditor = false,
): boolean => canEditNewsComment(comment, userId) || isEditor;

export const canInteractWithNewsComment = (
  comment: NewsComment,
  userId?: string | null,
): boolean => Boolean(userId && comment.userId !== userId);
