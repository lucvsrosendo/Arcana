import { Injectable, inject } from "@angular/core";
import { injectQuery } from "@tanstack/angular-query-experimental";
import { SupabaseService } from "./supabase.service";
import type { LanguageCode } from "@tarot/core";

export type SiteNewsItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  language: LanguageCode;
  publishedAt: string;
  coverImage?: string;
};

const fallbackNews: SiteNewsItem[] = [
  {
    id: "welcome",
    slug: "welcome",
    title: "Bem-vindo ao Tarot",
    summary: "Leituras zen com os 22 Arcanos Maiores.",
    body: "Explore tiragens, diário e aprendizado simbólico.",
    language: "pt",
    publishedAt: new Date().toISOString(),
  },
];

@Injectable({ providedIn: "root" })
export class NewsService {
  private readonly supabase = inject(SupabaseService);

  newsQuery(language: LanguageCode) {
    return injectQuery(() => ({
      queryKey: ["news", language],
      queryFn: () => this.fetchNews(language),
      placeholderData: fallbackNews.filter((item) => item.language === language),
      staleTime: 60_000,
    }));
  }

  async fetchNews(language: LanguageCode): Promise<SiteNewsItem[]> {
    if (!this.supabase.client) {
      return fallbackNews.filter((item) => item.language === language);
    }

    const { data, error } = await this.supabase.client
      .from("site_news")
      .select("id, slug, title, summary, body, language, published_at, cover_image")
      .eq("language", language)
      .eq("published", true)
      .order("published_at", { ascending: false })
      .limit(24);

    if (error) {
      console.warn("[NewsService] fetch failed:", error.message);
      return fallbackNews.filter((item) => item.language === language);
    }

    return (data ?? []).map((row) => ({
      id: String(row.id),
      slug: row.slug ?? String(row.id),
      title: row.title,
      summary: row.summary ?? "",
      body: row.body ?? "",
      language: row.language as LanguageCode,
      publishedAt: row.published_at ?? new Date().toISOString(),
      coverImage: row.cover_image ?? undefined,
    }));
  }

  async fetchById(id: string, language: LanguageCode): Promise<SiteNewsItem | null> {
    const items = await this.fetchNews(language);
    return items.find((item) => item.id === id || item.slug === id) ?? null;
  }
}
