import type { NewsComment } from "../data/siteNews";
import { isMissingTableError } from "./newsCloud";
import {
  createLocalComment,
  deleteLocalComment,
  listLocalComments,
  updateLocalComment,
} from "./newsCommentsLocal";
import { ensureUserProfile } from "./userProfileCloud";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const PAGE_SIZE = 20;
export const MAX_COMMENT_LENGTH = 2000;

export type NewsCommentSort = "newest" | "oldest" | "top";

export type CommentRow = {
  id: string;
  news_id: string;
  user_id: string;
  parent_id?: string | null;
  author_display_name: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type LikeRow = {
  comment_id: string;
  user_id: string;
};

type FavoriteRow = {
  comment_id: string;
  user_id: string;
};

type ProfileRow = {
  user_id: string;
  avatar_url: string | null;
};

const emptyInteractions = {
  likeCount: 0,
  favoriteCount: 0,
  likedByCurrentUser: false,
  favoritedByCurrentUser: false,
};

const rowToComment = (
  row: CommentRow,
  interactions = emptyInteractions,
  authorAvatarUrl?: string | null,
): NewsComment => ({
  id: row.id,
  newsId: row.news_id,
  userId: row.user_id,
  parentId: row.parent_id ?? null,
  authorDisplayName: row.author_display_name,
  authorAvatarUrl,
  body: row.body,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  likeCount: interactions.likeCount,
  favoriteCount: interactions.favoriteCount,
  likedByCurrentUser: interactions.likedByCurrentUser,
  favoritedByCurrentUser: interactions.favoritedByCurrentUser,
});

export const normalizeCommentBody = (body: string) => body.trim().slice(0, MAX_COMMENT_LENGTH);

const sortComments = (comments: NewsComment[], sort: NewsCommentSort) => {
  if (sort === "oldest") {
    return [...comments].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }

  if (sort === "top") {
    return [...comments].sort(
      (a, b) =>
        b.likeCount - a.likeCount ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return [...comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const enrichComments = async (
  rows: CommentRow[],
  currentUserId?: string | null,
): Promise<NewsComment[]> => {
  if (!supabase || rows.length === 0) {
    return rows.map((row) => rowToComment(row));
  }

  const commentIds = rows.map((row) => row.id);
  const authorIds = [...new Set(rows.map((row) => row.user_id))];

  const [likesResult, favoritesResult, profilesResult] = await Promise.all([
    supabase
      .from("site_news_comment_likes")
      .select("comment_id, user_id")
      .in("comment_id", commentIds),
    supabase
      .from("site_news_comment_favorites")
      .select("comment_id, user_id")
      .in("comment_id", commentIds),
    supabase.from("user_profiles").select("user_id, avatar_url").in("user_id", authorIds),
  ]);

  // Prefer bare comments over failing the whole list/save when related tables
  // are missing, blocked by RLS, or temporarily unreachable.
  const likes = likesResult.error ? [] : ((likesResult.data ?? []) as LikeRow[]);
  const favorites = favoritesResult.error
    ? []
    : ((favoritesResult.data ?? []) as FavoriteRow[]);
  const profiles = profilesResult.error
    ? []
    : ((profilesResult.data ?? []) as ProfileRow[]);

  const likeCountByComment = new Map<string, number>();
  const favoriteCountByComment = new Map<string, number>();
  const likedByUser = new Set<string>();
  const favoritedByUser = new Set<string>();
  const avatarByUser = new Map<string, string | null>();

  for (const like of likes) {
    likeCountByComment.set(like.comment_id, (likeCountByComment.get(like.comment_id) ?? 0) + 1);
    if (currentUserId && like.user_id === currentUserId) {
      likedByUser.add(like.comment_id);
    }
  }

  for (const favorite of favorites) {
    favoriteCountByComment.set(
      favorite.comment_id,
      (favoriteCountByComment.get(favorite.comment_id) ?? 0) + 1,
    );
    if (currentUserId && favorite.user_id === currentUserId) {
      favoritedByUser.add(favorite.comment_id);
    }
  }

  for (const profile of profiles) {
    avatarByUser.set(profile.user_id, profile.avatar_url);
  }

  return rows.map((row) =>
    rowToComment(
      row,
      {
        likeCount: likeCountByComment.get(row.id) ?? 0,
        favoriteCount: favoriteCountByComment.get(row.id) ?? 0,
        likedByCurrentUser: likedByUser.has(row.id),
        favoritedByCurrentUser: favoritedByUser.has(row.id),
      },
      avatarByUser.get(row.user_id) ?? null,
    ),
  );
};

export type FetchCommentsPageResult = {
  comments: NewsComment[];
  hasMore: boolean;
  featureAvailable: boolean;
  usingLocalFallback?: boolean;
};

const pageLocalComments = (
  newsId: string,
  sort: NewsCommentSort,
  offset: number,
  limit: number,
): FetchCommentsPageResult => {
  const sorted = sortComments(listLocalComments(newsId), sort);
  const slice = sorted.slice(offset, offset + limit);
  return {
    comments: slice,
    hasMore: offset + limit < sorted.length,
    featureAvailable: true,
    usingLocalFallback: true,
  };
};

export const fetchCommentsPage = async (
  newsId: string,
  options: {
    currentUserId?: string | null;
    sort?: NewsCommentSort;
    offset?: number;
    limit?: number;
  } = {},
): Promise<FetchCommentsPageResult> => {
  const sort = options.sort ?? "newest";
  const offset = options.offset ?? 0;
  const limit = options.limit ?? PAGE_SIZE;

  if (!isSupabaseConfigured || !supabase) {
    return pageLocalComments(newsId, sort, offset, limit);
  }

  if (sort === "top") {
    const { data, error } = await supabase
      .from("site_news_comments")
      .select("*")
      .eq("news_id", newsId);

    if (error) {
      if (isMissingTableError(error)) {
        return pageLocalComments(newsId, sort, offset, limit);
      }
      throw error;
    }

    const enriched = await enrichComments((data ?? []) as CommentRow[], options.currentUserId);
    const sorted = sortComments(enriched, sort);
    const slice = sorted.slice(offset, offset + limit);

    return {
      comments: slice,
      hasMore: offset + limit < sorted.length,
      featureAvailable: true,
    };
  }

  const ascending = sort === "oldest";
  const { data, error, count } = await supabase
    .from("site_news_comments")
    .select("*", { count: "exact" })
    .eq("news_id", newsId)
    .order("created_at", { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    if (isMissingTableError(error)) {
      return pageLocalComments(newsId, sort, offset, limit);
    }
    throw error;
  }

  const enriched = await enrichComments((data ?? []) as CommentRow[], options.currentUserId);
  const total = count ?? enriched.length;

  return {
    comments: enriched,
    hasMore: offset + limit < total,
    featureAvailable: true,
  };
};

export const fetchCommentsByNewsId = async (
  newsId: string,
  currentUserId?: string | null,
): Promise<NewsComment[]> => {
  const { comments } = await fetchCommentsPage(newsId, {
    currentUserId,
    sort: "oldest",
    offset: 0,
    limit: 10_000,
  });
  return comments;
};

const getErrorParts = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return {
      message: error instanceof Error ? error.message.toLowerCase() : "",
      code: "",
    };
  }

  const record = error as { message?: string; code?: string };
  return {
    message: String(record.message ?? "").toLowerCase(),
    code: String(record.code ?? ""),
  };
};

export const isMissingParentIdColumnError = (error: unknown) => {
  const { message, code } = getErrorParts(error);
  return (
    code === "42703" ||
    code === "PGRST204" ||
    (message.includes("parent_id") &&
      (message.includes("column") || message.includes("schema cache")))
  );
};

export const getCommentSaveErrorMessage = (error: unknown): string => {
  if (!error) {
    return "comment-save-error";
  }

  if (error instanceof Error && error.message === "login-required") {
    return "login-required";
  }

  const { message, code } = getErrorParts(error);

  if (
    code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return "comment-permission-denied";
  }

  if (message.includes("jwt") || message.includes("not authenticated")) {
    return "login-required";
  }

  if (
    code === "23503" ||
    message.includes("foreign key") ||
    message.includes("violates foreign key")
  ) {
    return "comment-foreign-key";
  }

  if (
    code === "42703" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    isMissingParentIdColumnError(error)
  ) {
    return "comment-schema-error";
  }

  return "comment-save-error";
};

const insertCommentRow = async (payload: {
  news_id: string;
  user_id: string;
  author_display_name: string;
  body: string;
  parent_id?: string;
}) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase.from("site_news_comments").insert(payload).select("*").single();
};

export const createComment = async (
  newsId: string,
  body: string,
  displayName: string,
  userId: string,
  parentId?: string | null,
) => {
  const normalizedBody = normalizeCommentBody(body);
  if (!normalizedBody) {
    throw new Error("Comment body is required.");
  }

  const authorName = displayName.trim() || "User";

  if (!supabase) {
    return createLocalComment({
      newsId,
      userId,
      displayName: authorName,
      body: normalizedBody,
      parentId,
    });
  }

  // Best-effort: XP trigger is also hardened server-side so comments still save.
  try {
    await ensureUserProfile();
  } catch {
    // ignore
  }

  const basePayload = {
    news_id: newsId,
    user_id: userId,
    author_display_name: authorName,
    body: normalizedBody,
  };

  let { data, error } = await insertCommentRow(
    parentId ? { ...basePayload, parent_id: parentId } : basePayload,
  );

  if (error && parentId && isMissingParentIdColumnError(error)) {
    ({ data, error } = await insertCommentRow(basePayload));
  }

  if (error && isMissingTableError(error)) {
    return createLocalComment({
      newsId,
      userId,
      displayName: basePayload.author_display_name,
      body: normalizedBody,
      parentId,
    });
  }

  if (error) {
    throw error;
  }

  const row = data as CommentRow;

  try {
    const enriched = await enrichComments([row], userId);
    return enriched[0] ?? rowToComment(row);
  } catch {
    return rowToComment(row);
  }
};

export const updateComment = async (
  commentId: string,
  body: string,
  currentUserId?: string,
  newsId?: string,
) => {
  const normalizedBody = normalizeCommentBody(body);
  if (!normalizedBody) {
    throw new Error("Comment body is required.");
  }

  if (!supabase) {
    if (!newsId) {
      throw new Error("Supabase is not configured.");
    }
    const local = updateLocalComment(newsId, commentId, normalizedBody);
    if (!local) {
      throw new Error("Comment not found.");
    }
    return local;
  }

  const { data, error } = await supabase
    .from("site_news_comments")
    .update({ body: normalizedBody })
    .eq("id", commentId)
    .select("*")
    .single();

  if (error && isMissingTableError(error) && newsId) {
    const local = updateLocalComment(newsId, commentId, normalizedBody);
    if (!local) {
      throw error;
    }
    return local;
  }

  if (error) {
    throw error;
  }

  const row = data as CommentRow;

  try {
    const enriched = await enrichComments([row], currentUserId);
    return enriched[0] ?? rowToComment(row);
  } catch {
    return rowToComment(row);
  }
};

export const deleteComment = async (commentId: string, newsId?: string) => {
  if (!supabase) {
    if (!newsId) {
      throw new Error("Supabase is not configured.");
    }
    deleteLocalComment(newsId, commentId);
    return;
  }

  const { error } = await supabase
    .from("site_news_comments")
    .delete()
    .eq("id", commentId);

  if (error && isMissingTableError(error) && newsId) {
    deleteLocalComment(newsId, commentId);
    return;
  }

  if (error) {
    throw error;
  }
};
