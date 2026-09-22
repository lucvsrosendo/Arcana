import { Injectable, inject } from "@angular/core";
import { SupabaseService } from "./supabase.service";

export type LanguageCode = "pt" | "en" | "es";

export type NewsRecord = {
  id: string;
  date: string;
  tag_pt: string;
  tag_en: string;
  tag_es: string;
  title_pt: string;
  title_en: string;
  title_es: string;
  summary_pt: string;
  summary_en: string;
  summary_es: string;
  body_pt: string;
  body_en: string;
  body_es: string;
  created_at: string;
};

export type NewsPayload = {
  date: string;
  tag: Record<LanguageCode, string>;
  title: Record<LanguageCode, string>;
  summary: Record<LanguageCode, string>;
  body?: Partial<Record<LanguageCode, string>>;
};

type NewsRow = NewsRecord;

const bodyFieldsFromPayload = (payload: NewsPayload) => ({
  body_pt: payload.body?.pt?.trim() ?? "",
  body_en: payload.body?.en?.trim() ?? payload.body?.pt?.trim() ?? "",
  body_es: payload.body?.es?.trim() ?? payload.body?.pt?.trim() ?? "",
});

@Injectable({ providedIn: "root" })
export class NewsAdminService {
  private readonly supabase = inject(SupabaseService);

  async fetchAll(): Promise<NewsRecord[]> {
    const client = this.requireClient();

    const { data, error } = await client
      .from("site_news")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return ((data ?? []) as NewsRow[]).map((row) => ({
      ...row,
      body_pt: row.body_pt ?? "",
      body_en: row.body_en ?? "",
      body_es: row.body_es ?? "",
    }));
  }

  async create(payload: NewsPayload): Promise<void> {
    const client = this.requireClient();

    const { error } = await client.from("site_news").insert({
      date: payload.date,
      tag_pt: payload.tag.pt,
      tag_en: payload.tag.en,
      tag_es: payload.tag.es,
      title_pt: payload.title.pt,
      title_en: payload.title.en,
      title_es: payload.title.es,
      summary_pt: payload.summary.pt,
      summary_en: payload.summary.en,
      summary_es: payload.summary.es,
      ...bodyFieldsFromPayload(payload),
    });

    if (error) {
      throw error;
    }
  }

  async update(newsId: string, payload: NewsPayload): Promise<void> {
    const client = this.requireClient();

    const { error } = await client
      .from("site_news")
      .update({
        date: payload.date,
        tag_pt: payload.tag.pt,
        tag_en: payload.tag.en,
        tag_es: payload.tag.es,
        title_pt: payload.title.pt,
        title_en: payload.title.en,
        title_es: payload.title.es,
        summary_pt: payload.summary.pt,
        summary_en: payload.summary.en,
        summary_es: payload.summary.es,
        ...bodyFieldsFromPayload(payload),
      })
      .eq("id", newsId);

    if (error) {
      throw error;
    }
  }

  async remove(newsId: string): Promise<void> {
    const client = this.requireClient();

    const { error } = await client.from("site_news").delete().eq("id", newsId);
    if (error) {
      throw error;
    }
  }

  async countAll(): Promise<number> {
    const client = this.requireClient();
    const { count, error } = await client
      .from("site_news")
      .select("*", { count: "exact", head: true });

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  private requireClient() {
    if (!this.supabase.client) {
      throw new Error("Supabase is not configured.");
    }

    return this.supabase.client;
  }
}
