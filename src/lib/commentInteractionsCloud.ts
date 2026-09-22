import { supabase, isSupabaseConfigured } from "./supabaseClient";

export type ToggleLikeResult = {
  liked: boolean;
  likeCount: number;
};

export type ToggleFavoriteResult = {
  favorited: boolean;
  favoriteCount: number;
};

export const toggleCommentLike = async (commentId: string): Promise<ToggleLikeResult> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("toggle_comment_like", {
    p_comment_id: commentId,
  });

  if (error) {
    throw error;
  }

  const result = data as { liked: boolean; likeCount: number };
  return {
    liked: Boolean(result.liked),
    likeCount: Number(result.likeCount ?? 0),
  };
};

export const toggleCommentFavorite = async (
  commentId: string,
): Promise<ToggleFavoriteResult> => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { data, error } = await supabase.rpc("toggle_comment_favorite", {
    p_comment_id: commentId,
  });

  if (error) {
    throw error;
  }

  const result = data as { favorited: boolean; favoriteCount: number };
  return {
    favorited: Boolean(result.favorited),
    favoriteCount: Number(result.favoriteCount ?? 0),
  };
};

export const isSelfInteractionError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return message.includes("self-interaction-blocked");
};
