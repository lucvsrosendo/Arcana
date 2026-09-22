import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import type { NewsComment } from "../data/siteNews";
import {
  toggleCommentFavorite,
  toggleCommentLike,
} from "../lib/commentInteractionsCloud";
import {
  createComment,
  deleteComment,
  fetchCommentsPage,
  PAGE_SIZE,
  updateComment,
  type FetchCommentsPageResult,
  type NewsCommentSort,
} from "../lib/newsCommentsCloud";
import {
  canDeleteNewsComment,
  canEditNewsComment,
  canInteractWithNewsComment,
} from "../lib/newsCommentPermissions";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient";

export type { NewsCommentSort };

export const newsCommentsQueryKey = (newsId: string, sort: NewsCommentSort) =>
  ["news-comments", newsId, sort] as const;

export type OptimisticLikeUpdate = {
  commentId: string;
  likedByCurrentUser: boolean;
  likeCount: number;
};

/** Applies an optimistic like toggle; returns next state and snapshot for rollback (react-query ready). */
export const applyOptimisticLike = (
  comments: NewsComment[],
  commentId: string,
): { next: NewsComment[]; rollback: NewsComment[]; update: OptimisticLikeUpdate | null } => {
  const rollback = comments;
  const target = comments.find((comment) => comment.id === commentId);
  if (!target) {
    return { next: comments, rollback, update: null };
  }

  const optimisticLiked = !target.likedByCurrentUser;
  const update: OptimisticLikeUpdate = {
    commentId,
    likedByCurrentUser: optimisticLiked,
    likeCount: Math.max(0, target.likeCount + (optimisticLiked ? 1 : -1)),
  };

  const next = comments.map((comment) =>
    comment.id === commentId
      ? {
          ...comment,
          likedByCurrentUser: update.likedByCurrentUser,
          likeCount: update.likeCount,
        }
      : comment,
  );

  return { next, rollback, update };
};

export const reconcileLikeFromServer = (
  comments: NewsComment[],
  commentId: string,
  result: { liked: boolean; likeCount: number },
): NewsComment[] =>
  comments.map((comment) =>
    comment.id === commentId
      ? {
          ...comment,
          likedByCurrentUser: result.liked,
          likeCount: result.likeCount,
        }
      : comment,
  );

type CommentsInfiniteData = InfiniteData<FetchCommentsPageResult, number>;

const getFlatComments = (data: CommentsInfiniteData | undefined): NewsComment[] =>
  data?.pages.flatMap((page) => page.comments) ?? [];

const mapCommentsInInfiniteData = (
  data: CommentsInfiniteData,
  mapper: (comments: NewsComment[]) => NewsComment[],
): CommentsInfiniteData => {
  const flat = getFlatComments(data);
  const mapped = mapper(flat);
  let index = 0;

  return {
    ...data,
    pages: data.pages.map((page) => {
      const pageComments = mapped.slice(index, index + page.comments.length);
      index += page.comments.length;
      return { ...page, comments: pageComments };
    }),
  };
};

const appendCommentToInfiniteData = (
  data: CommentsInfiniteData,
  comment: NewsComment,
): CommentsInfiniteData => {
  const pages = [...data.pages];
  const lastIndex = pages.length - 1;

  pages[lastIndex] = {
    ...pages[lastIndex],
    comments: [...pages[lastIndex].comments, comment],
  };

  return { ...data, pages };
};

const replaceCommentInInfiniteData = (
  data: CommentsInfiniteData,
  commentId: string,
  replacement: NewsComment,
): CommentsInfiniteData => ({
  ...data,
  pages: data.pages.map((page) => ({
    ...page,
    comments: page.comments.map((comment) =>
      comment.id === commentId ? replacement : comment,
    ),
  })),
});

const removeCommentFromInfiniteData = (
  data: CommentsInfiniteData,
  commentId: string,
): CommentsInfiniteData => ({
  ...data,
  pages: data.pages.map((page) => ({
    ...page,
    comments: page.comments.filter((comment) => comment.id !== commentId),
  })),
});

type UseNewsCommentsOptions = {
  newsId: string;
  userId?: string | null;
  displayName?: string;
  isEditor?: boolean;
  sort?: NewsCommentSort;
  onXpChange?: () => Promise<void>;
};

export const useNewsComments = ({
  newsId,
  userId,
  displayName = "User",
  isEditor = false,
  sort = "newest",
  onXpChange,
}: UseNewsCommentsOptions) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => newsCommentsQueryKey(newsId, sort), [newsId, sort]);

  const refreshXp = async () => {
    if (onXpChange) {
      await onXpChange();
    }
  };

  const commentsQuery = useInfiniteQuery({
    queryKey,
    enabled: Boolean(newsId),
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchCommentsPage(newsId, {
        currentUserId: userId,
        sort,
        offset: pageParam,
        limit: PAGE_SIZE,
      }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) {
        return undefined;
      }

      return allPages.reduce((offset, page) => offset + page.comments.length, 0);
    },
  });

  const prevUserIdRef = useRef(userId);

  useEffect(() => {
    if (!newsId || prevUserIdRef.current === userId) {
      prevUserIdRef.current = userId;
      return;
    }

    prevUserIdRef.current = userId;
    void queryClient.invalidateQueries({ queryKey });
  }, [userId, newsId, queryClient, queryKey]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !newsId) {
      return;
    }

    const featureAvailable = commentsQuery.data?.pages[0]?.featureAvailable;
    if (featureAvailable !== true) {
      return;
    }

    const client = supabase;

    const channel = client
      .channel(`news-comments-${newsId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_news_comments",
          filter: `news_id=eq.${newsId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [commentsQuery.data?.pages, newsId, queryClient, queryKey]);

  const setInfiniteComments = useCallback(
    (updater: (data: CommentsInfiniteData) => CommentsInfiniteData) => {
      queryClient.setQueryData<CommentsInfiniteData>(queryKey, (current) => {
        if (!current) {
          return current;
        }

        return updater(current);
      });
    },
    [queryClient, queryKey],
  );

  const addCommentMutation = useMutation({
    mutationFn: async ({
      body,
      parentId,
    }: {
      body: string;
      parentId?: string | null;
    }) => {
      if (!userId) {
        throw new Error("login-required");
      }

      return createComment(newsId, body, displayName, userId, parentId);
    },
    onSuccess: (created) => {
      setInfiniteComments((current) => appendCommentToInfiniteData(current, created));
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: async ({ commentId, body }: { commentId: string; body: string }) =>
      updateComment(commentId, body, userId ?? undefined, newsId),
    onSuccess: (updated, { commentId }) => {
      setInfiniteComments((current) =>
        replaceCommentInInfiniteData(current, commentId, updated),
      );
    },
  });

  const removeCommentMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId, newsId),
    onSuccess: (_, commentId) => {
      setInfiniteComments((current) => removeCommentFromInfiniteData(current, commentId));
    },
    onSettled: () => {
      void refreshXp();
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: (commentId: string) => toggleCommentLike(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<CommentsInfiniteData>(queryKey);
      if (!previous) {
        return { previous };
      }

      const { next, update } = applyOptimisticLike(getFlatComments(previous), commentId);
      if (!update) {
        return { previous };
      }

      queryClient.setQueryData<CommentsInfiniteData>(queryKey, (current) =>
        current ? mapCommentsInInfiniteData(current, () => next) : current,
      );

      return { previous };
    },
    onError: (_error, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (result, commentId) => {
      setInfiniteComments((current) =>
        mapCommentsInInfiniteData(current, (comments) =>
          reconcileLikeFromServer(comments, commentId, result),
        ),
      );
    },
    onSettled: () => {
      void refreshXp();
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: (commentId: string) => toggleCommentFavorite(commentId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData<CommentsInfiniteData>(queryKey);
      if (!previous) {
        return { previous };
      }

      const flat = getFlatComments(previous);
      const target = flat.find((comment) => comment.id === commentId);
      if (!target) {
        return { previous };
      }

      const optimisticFavorited = !target.favoritedByCurrentUser;
      const next = flat.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              favoritedByCurrentUser: optimisticFavorited,
              favoriteCount: Math.max(
                0,
                comment.favoriteCount + (optimisticFavorited ? 1 : -1),
              ),
            }
          : comment,
      );

      queryClient.setQueryData<CommentsInfiniteData>(queryKey, (current) =>
        current ? mapCommentsInInfiniteData(current, () => next) : current,
      );

      return { previous };
    },
    onError: (_error, _commentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSuccess: (result, commentId) => {
      setInfiniteComments((current) =>
        mapCommentsInInfiniteData(current, (comments) =>
          comments.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  favoritedByCurrentUser: result.favorited,
                  favoriteCount: result.favoriteCount,
                }
              : comment,
          ),
        ),
      );
    },
    onSettled: () => {
      void refreshXp();
    },
  });

  const comments = getFlatComments(commentsQuery.data as CommentsInfiniteData | undefined);
  const commentsFeatureAvailable = commentsQuery.isLoading
    ? null
    : (commentsQuery.data?.pages[0]?.featureAvailable ?? !commentsQuery.isError);
  const usingLocalFallback =
    !commentsQuery.isLoading &&
    Boolean(commentsQuery.data?.pages[0]?.usingLocalFallback);
  const error =
    commentsQuery.error instanceof Error
      ? commentsQuery.error.message
      : commentsQuery.error
        ? "load-error"
        : null;

  const loadMore = async () => {
    if (commentsQuery.isFetchingNextPage || !commentsQuery.hasNextPage) {
      return;
    }

    await commentsQuery.fetchNextPage();
  };

  const addComment = async (body: string, parentId?: string | null) => {
    const created = await addCommentMutation.mutateAsync({ body, parentId });
    await refreshXp();
    return created;
  };

  const editComment = async (commentId: string, body: string) =>
    editCommentMutation.mutateAsync({ commentId, body });

  const removeComment = async (commentId: string) => {
    await removeCommentMutation.mutateAsync(commentId);
  };

  const toggleLike = async (commentId: string) => toggleLikeMutation.mutateAsync(commentId);

  const toggleFavorite = async (commentId: string) =>
    toggleFavoriteMutation.mutateAsync(commentId);

  const canEdit = (comment: NewsComment) => canEditNewsComment(comment, userId);
  const canDelete = (comment: NewsComment) =>
    canDeleteNewsComment(comment, userId, isEditor);
  const canInteract = (comment: NewsComment) =>
    canInteractWithNewsComment(comment, userId);

  return {
    comments,
    isLoading: commentsQuery.isLoading,
    isLoadingMore: commentsQuery.isFetchingNextPage,
    hasMore: commentsQuery.hasNextPage ?? false,
    commentsFeatureAvailable,
    usingLocalFallback,
    error,
    sort,
    addComment,
    editComment,
    removeComment,
    toggleLike,
    toggleFavorite,
    loadMore,
    reloadComments: () => commentsQuery.refetch(),
    canEdit,
    canDelete,
    canInteract,
  };
};
