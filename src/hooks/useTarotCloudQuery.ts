import { useQuery } from "@tanstack/react-query";

export const tarotCloudQueryKey = ["tarot-account"] as const;

export const useTarotCloudQuery = (enabled: boolean) =>
  useQuery({
    queryKey: tarotCloudQueryKey,
    queryFn: async () => {
      const { fetchCloudAccountData } = await import("../lib/tarotCloud");
      return fetchCloudAccountData();
    },
    enabled,
    staleTime: 30_000,
    retry: 1,
  });
