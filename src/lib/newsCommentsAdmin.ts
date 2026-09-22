import { isMissingTableError } from "./newsCloud";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

export type AdminCommentRecord = {
  id: string;
  newsId: string;
  newsTitle: string;
  userId: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
  parentId: string | null;
};

type CommentRow = {
  id: string;
  news_id: string;
  user_id: string;
  parent_id: string | null;
  author_display_name: string;
  body: string;
  created_at: string;
};

type NewsTitleRow = {
  id: string;
  title_pt: string;
};

export const fetchAllCommentsForAdmin = async (): Promise<AdminCommentRecord[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data: comments, error: commentsError } = await supabase
    .from("site_news_comments")
    .select("id, news_id, user_id, parent_id, author_display_name, body, created_at")
    .order("created_at", { ascending: false });

  if (commentsError) {
    if (isMissingTableError(commentsError)) {
      return [];
    }
    throw commentsError;
  }

  const rows = (comments ?? []) as CommentRow[];
  if (rows.length === 0) {
    return [];
  }

  const newsIds = [...new Set(rows.map((row) => row.news_id))];
  const { data: newsRows, error: newsError } = await supabase
    .from("site_news")
    .select("id, title_pt")
    .in("id", newsIds);

  if (newsError) {
    throw newsError;
  }

  const titleByNewsId = new Map<string, string>();
  for (const news of (newsRows ?? []) as NewsTitleRow[]) {
    titleByNewsId.set(news.id, news.title_pt);
  }

  return rows.map((row) => ({
    id: row.id,
    newsId: row.news_id,
    newsTitle: titleByNewsId.get(row.news_id) ?? row.news_id,
    userId: row.user_id,
    authorDisplayName: row.author_display_name,
    body: row.body,
    createdAt: row.created_at,
    parentId: row.parent_id,
  }));
};

export const deleteCommentAsAdmin = async (commentId: string) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("site_news_comments")
    .delete()
    .eq("id", commentId);

  if (error) {
    throw error;
  }
};
