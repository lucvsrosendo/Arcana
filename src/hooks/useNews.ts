import { useQuery } from "@tanstack/react-query";
import type { SiteNewsItem } from "../data/siteNews";
import type { LanguageCode } from "../types/tarot";

export const newsQueryKey = (language: LanguageCode) => ["news", language] as const;

const fetchNews = async (language: LanguageCode): Promise<SiteNewsItem[]> => {
  const { fetchCloudNews } = await import("../lib/newsCloud");
  const cloudNews = await fetchCloudNews(language);
  return cloudNews ?? [];
};

export const useNews = (language: LanguageCode) => {
  const query = useQuery({
    queryKey: newsQueryKey(language),
    queryFn: () => fetchNews(language),
    staleTime: 60_000,
  });

  return {
    news: query.data ?? [],
    isLoading: query.isLoading,
  };
};
