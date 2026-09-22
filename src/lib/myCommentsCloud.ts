import type { NewsComment } from "@/data/siteNews";
import {
  enrichComments,
  type CommentRow,
} from "@/lib/newsCommentsCloud";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export type UserCommentWithNews = NewsComment & {
  newsTitle: string;
};

type NewsTitleRow = {
  id: string;
  title_pt: string;
  title_en: string;
  title_es: string;
};

export const fetchCommentsByUserId = async (
  userId: string,
  currentUserId?: string | null,
): Promise<UserCommentWithNews[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data: comments, error: commentsError } = await supabase
    .from("site_news_comments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (commentsError) {
    throw commentsError;
  }

  const rows = (comments ?? []) as CommentRow[];
  if (rows.length === 0) {
    return [];
  }

  const newsIds = [...new Set(rows.map((row) => row.news_id))];
  const { data: newsRows, error: newsError } = await supabase
    .from("site_news")
    .select("id, title_pt, title_en, title_es")
    .in("id", newsIds);

  if (newsError) {
    throw newsError;
  }

  const titleByNewsId = new Map<string, string>();
  for (const news of (newsRows ?? []) as NewsTitleRow[]) {
    titleByNewsId.set(news.id, news.title_pt || news.title_en || news.title_es);
  }

  const enriched = await enrichComments(rows, currentUserId ?? userId);

  return enriched.map((comment) => ({
    ...comment,
    newsTitle: titleByNewsId.get(comment.newsId) ?? comment.newsId,
  }));
};
