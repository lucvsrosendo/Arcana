import { Injectable, inject } from "@angular/core";
import { containsProfanity } from "@tarot/core/profanity";
import { SupabaseService } from "./supabase.service";

export type AdminCommentRecord = {
  id: string;
  newsId: string;
  newsTitle: string;
  userId: string;
  authorDisplayName: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  flaggedProfanity: boolean;
};

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

export type CommentsPerDayPoint = {
  day: string;
  count: number;
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

type ReportRow = {
  id: string;
  comment_id: string;
  reporter_id: string;
  reason: string;
  created_at: string;
};

@Injectable({ providedIn: "root" })
export class CommentsAdminService {
  private readonly supabase = inject(SupabaseService);

  async fetchAllComments(): Promise<AdminCommentRecord[]> {
    const client = this.requireClient();

    const { data: comments, error: commentsError } = await client
      .from("site_news_comments")
      .select("id, news_id, user_id, parent_id, author_display_name, body, created_at")
      .order("created_at", { ascending: false });

    if (commentsError) {
      throw commentsError;
    }

    const rows = (comments ?? []) as CommentRow[];
    if (rows.length === 0) {
      return [];
    }

    const newsIds = [...new Set(rows.map((row) => row.news_id))];
    const { data: newsRows, error: newsError } = await client
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
      flaggedProfanity: containsProfanity(row.body),
    }));
  }

  async deleteComment(commentId: string): Promise<void> {
    const client = this.requireClient();

    const { error } = await client
      .from("site_news_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      throw error;
    }
  }

  async fetchReports(): Promise<CommentReportRecord[]> {
    const client = this.requireClient();

    const { data: reports, error: reportsError } = await client
      .from("comment_reports")
      .select("id, comment_id, reporter_id, reason, created_at")
      .order("created_at", { ascending: false });

    if (reportsError) {
      throw reportsError;
    }

    const rows = (reports ?? []) as ReportRow[];
    if (rows.length === 0) {
      return [];
    }

    const commentIds = [...new Set(rows.map((row) => row.comment_id))];
    const { data: comments, error: commentsError } = await client
      .from("site_news_comments")
      .select("id, news_id, author_display_name, body")
      .in("id", commentIds);

    if (commentsError) {
      throw commentsError;
    }

    const commentById = new Map<
      string,
      { newsId: string; author: string; body: string }
    >();
    for (const comment of comments ?? []) {
      commentById.set(comment.id as string, {
        newsId: comment.news_id as string,
        author: comment.author_display_name as string,
        body: comment.body as string,
      });
    }

    const newsIds = [
      ...new Set(
        [...commentById.values()]
          .map((comment) => comment.newsId)
          .filter(Boolean),
      ),
    ];

    const titleByNewsId = new Map<string, string>();
    if (newsIds.length > 0) {
      const { data: newsRows, error: newsError } = await client
        .from("site_news")
        .select("id, title_pt")
        .in("id", newsIds);

      if (newsError) {
        throw newsError;
      }

      for (const news of (newsRows ?? []) as NewsTitleRow[]) {
        titleByNewsId.set(news.id, news.title_pt);
      }
    }

    return rows
      .map((row) => {
        const comment = commentById.get(row.comment_id);
        if (!comment) {
          return null;
        }

        return {
          id: row.id,
          commentId: row.comment_id,
          reporterId: row.reporter_id,
          reason: row.reason,
          createdAt: row.created_at,
          commentBody: comment.body,
          commentAuthor: comment.author,
          newsId: comment.newsId,
          newsTitle: titleByNewsId.get(comment.newsId) ?? comment.newsId,
        };
      })
      .filter((row): row is CommentReportRecord => row !== null);
  }

  async countAllComments(): Promise<number> {
    const client = this.requireClient();
    const { count, error } = await client
      .from("site_news_comments")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async countReports(): Promise<number> {
    const client = this.requireClient();
    const { count, error } = await client
      .from("comment_reports")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async countCommentsToday(): Promise<number> {
    const client = this.requireClient();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count, error } = await client
      .from("site_news_comments")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay.toISOString());

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async commentsPerDay(days = 14): Promise<CommentsPerDayPoint[]> {
    const comments = await this.fetchAllComments();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (days - 1));

    const buckets = new Map<string, number>();
    for (let offset = 0; offset < days; offset += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + offset);
      buckets.set(day.toISOString().slice(0, 10), 0);
    }

    for (const comment of comments) {
      const dayKey = comment.createdAt.slice(0, 10);
      if (!buckets.has(dayKey)) {
        continue;
      }
      buckets.set(dayKey, (buckets.get(dayKey) ?? 0) + 1);
    }

    return [...buckets.entries()].map(([day, count]) => ({ day, count }));
  }

  private requireClient() {
    if (!this.supabase.client) {
      throw new Error("Supabase is not configured.");
    }

    return this.supabase.client;
  }
}
