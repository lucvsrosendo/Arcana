import { isMissingTableError } from "./newsCloud";
import { supabase } from "./supabaseClient";

export type CommentReportRecord = {
  id: string;
  commentId: string;
  reporterId: string;
  reason: string;
  createdAt: string;
  commentBody: string;
  commentAuthor: string;
  newsTitle: string;
  newsId: string;
};

type ReportRow = {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
};

export const fetchCommentReports = async (): Promise<CommentReportRecord[]> => {
  if (!supabase) {
    return [];
  }

  const { data: reports, error: reportsError } = await supabase
    .from("comment_reports")
    .select("id, comment_id, reporter_id, reason, created_at")
    .order("created_at", { ascending: false });

  if (reportsError) {
    if (isMissingTableError(reportsError)) {
      return [];
    }
    throw reportsError;
  }

  const rows = (reports ?? []) as ReportRow[];
  if (rows.length === 0) {
    return [];
  }

  const commentIds = [...new Set(rows.map((row) => row.comment_id))];
  const { data: comments, error: commentsError } = await supabase
    .from("site_news_comments")
    .select("id, news_id, author_display_name, body")
    .in("id", commentIds);

  if (commentsError) {
    throw commentsError;
  }

  const commentById = new Map(
    (comments ?? []).map((comment) => [comment.id as string, comment]),
  );

  const newsIds = [
    ...new Set(
      (comments ?? []).map((comment) => comment.news_id as string),
    ),
  ];

  const { data: newsRows, error: newsError } = await supabase
    .from("site_news")
    .select("id, title_pt")
    .in("id", newsIds);

  if (newsError) {
    throw newsError;
  }

  const titleByNewsId = new Map(
    (newsRows ?? []).map((news) => [news.id as string, news.title_pt as string]),
  );

  return rows.map((row) => {
    const comment = commentById.get(row.comment_id);
    const newsId = (comment?.news_id as string) ?? "";
    return {
      id: row.id,
      commentId: row.comment_id,
      reporterId: row.reporter_id,
      reason: row.reason,
      createdAt: row.created_at,
      commentBody: (comment?.body as string) ?? "",
      commentAuthor: (comment?.author_display_name as string) ?? "Unknown",
      newsTitle: titleByNewsId.get(newsId) ?? newsId,
      newsId,
    };
  });
};

export const dismissCommentReport = async (reportId: string) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("comment_reports").delete().eq("id", reportId);

  if (error) {
    throw error;
  }
};
