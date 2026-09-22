import type { NewsComment } from "../data/siteNews";

const storageKey = (newsId: string) => `tarot.localNewsComments.${newsId}`;

const emptyInteractions = {
  likeCount: 0,
  favoriteCount: 0,
  likedByCurrentUser: false,
  favoritedByCurrentUser: false,
};

const readRaw = (newsId: string): NewsComment[] => {
  if (typeof localStorage === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(storageKey(newsId));
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as NewsComment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeRaw = (newsId: string, comments: NewsComment[]) => {
  if (typeof localStorage === "undefined") {
    return;
  }
  localStorage.setItem(storageKey(newsId), JSON.stringify(comments));
};

export const listLocalComments = (newsId: string): NewsComment[] =>
  [...readRaw(newsId)].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

export const createLocalComment = (input: {
  newsId: string;
  userId: string;
  displayName: string;
  body: string;
  parentId?: string | null;
}): NewsComment => {
  const now = new Date().toISOString();
  const comment: NewsComment = {
    id: crypto.randomUUID(),
    newsId: input.newsId,
    userId: input.userId,
    parentId: input.parentId ?? null,
    authorDisplayName: input.displayName,
    authorAvatarUrl: null,
    body: input.body,
    createdAt: now,
    updatedAt: now,
    ...emptyInteractions,
  };

  const next = [comment, ...readRaw(input.newsId)];
  writeRaw(input.newsId, next);
  return comment;
};

export const updateLocalComment = (
  newsId: string,
  commentId: string,
  body: string,
): NewsComment | null => {
  const comments = readRaw(newsId);
  const index = comments.findIndex((comment) => comment.id === commentId);
  if (index < 0) {
    return null;
  }

  const updated: NewsComment = {
    ...comments[index],
    body,
    updatedAt: new Date().toISOString(),
  };
  comments[index] = updated;
  writeRaw(newsId, comments);
  return updated;
};

export const deleteLocalComment = (newsId: string, commentId: string) => {
  writeRaw(
    newsId,
    readRaw(newsId).filter((comment) => comment.id !== commentId),
  );
};
