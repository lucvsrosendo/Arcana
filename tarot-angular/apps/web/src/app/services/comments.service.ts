import { Injectable, inject } from "@angular/core";
import { injectMutation, injectQuery, injectQueryClient } from "@tanstack/angular-query-experimental";
import { SupabaseService } from "./supabase.service";
import { ProfanityService } from "./profanity.service";

export type NewsComment = {
  id: string;
  newsId: string;
  body: string;
  displayName: string;
  userId?: string;
  parentId?: string;
  createdAt: string;
  likeCount: number;
};

export type NewsCommentSort = "newest" | "oldest";

@Injectable({ providedIn: "root" })
export class CommentsService {
  private readonly supabase = inject(SupabaseService);
  private readonly profanity = inject(ProfanityService);
  private readonly queryClient = injectQueryClient();

  commentsQuery(newsId: string, sort: NewsCommentSort = "newest") {
    return injectQuery(() => ({
      queryKey: ["news-comments", newsId, sort],
      queryFn: () => this.fetchComments(newsId, sort),
      enabled: Boolean(newsId),
      staleTime: 20_000,
    }));
  }

  createCommentMutation(newsId: string, sort: NewsCommentSort = "newest") {
    return injectMutation(() => ({
      mutationFn: (input: {
        body: string;
        displayName: string;
        userId?: string;
        parentId?: string;
      }) => this.createComment(newsId, input),
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ["news-comments", newsId, sort] });
      },
    }));
  }

  async fetchComments(newsId: string, sort: NewsCommentSort): Promise<NewsComment[]> {
    if (!this.supabase.client) {
      return [];
    }

    const query = this.supabase.client
      .from("site_news_comments")
      .select("id, news_id, body, display_name, user_id, parent_id, created_at, like_count")
      .eq("news_id", newsId)
      .order("created_at", { ascending: sort === "oldest" })
      .limit(80);

    const { data, error } = await query;
    if (error) {
      console.warn("[CommentsService] fetch failed:", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      newsId: String(row.news_id),
      body: row.body,
      displayName: row.display_name ?? "Guest",
      userId: row.user_id ?? undefined,
      parentId: row.parent_id ?? undefined,
      createdAt: row.created_at,
      likeCount: row.like_count ?? 0,
    }));
  }

  async createComment(
    newsId: string,
    input: { body: string; displayName: string; userId?: string; parentId?: string },
  ) {
    if (!this.supabase.client) {
      throw new Error("Comments require Supabase configuration.");
    }

    const body = input.body.trim();
    if (!body) {
      throw new Error("Comment cannot be empty.");
    }

    if (this.profanity.containsProfanity(body)) {
      throw new Error("Comment contains blocked language.");
    }

    const { data, error } = await this.supabase.client
      .from("site_news_comments")
      .insert({
        news_id: newsId,
        body: this.profanity.clean(body),
        display_name: input.displayName.trim() || "Guest",
        user_id: input.userId ?? null,
        parent_id: input.parentId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
}
