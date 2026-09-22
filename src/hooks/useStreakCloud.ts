import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./useAuth";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type UserStreak = {
  streakCount: number;
  lastVisitDate: string | null;
  leaderboardOptIn: boolean;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  xpTotal: number;
};

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPreviousDateKey = (dateKey: string) => {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() - 1);
  return getLocalDateKey(date);
};

export const streakQueryKey = (userId: string | undefined) => ["user-streak", userId] as const;

export const leaderboardQueryKey = ["leaderboard"] as const;

const fetchStreak = async (userId: string): Promise<UserStreak | null> => {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_streaks")
    .select("streak_count, last_visit_date, leaderboard_opt_in")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[useStreakCloud] fetch failed:", error.message);
    return null;
  }

  if (!data) {
    return { streakCount: 0, lastVisitDate: null, leaderboardOptIn: false };
  }

  return {
    streakCount: data.streak_count ?? 0,
    lastVisitDate: data.last_visit_date,
    leaderboardOptIn: Boolean(data.leaderboard_opt_in),
  };
};

const upsertStreak = async (
  userId: string,
  input: { streakCount: number; lastVisitDate: string },
) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("user_streaks").upsert({
    user_id: userId,
    streak_count: input.streakCount,
    last_visit_date: input.lastVisitDate,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
};

const setLeaderboardOptIn = async (userId: string, optIn: boolean) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("user_streaks").upsert({
    user_id: userId,
    leaderboard_opt_in: optIn,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
};

const fetchLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  if (!supabase) {
    return [];
  }

  const { data: optedIn, error: streakError } = await supabase
    .from("user_streaks")
    .select("user_id")
    .eq("leaderboard_opt_in", true);

  if (streakError) {
    console.warn("[useStreakCloud] leaderboard opt-in failed:", streakError.message);
    return [];
  }

  const optedInIds = (optedIn ?? []).map((row) => row.user_id as string);
  if (optedInIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, avatar_url, xp_total")
    .in("user_id", optedInIds)
    .order("xp_total", { ascending: false })
    .limit(10);

  if (error) {
    console.warn("[useStreakCloud] leaderboard failed:", error.message);
    return [];
  }

  return (data ?? []).map((row, index) => ({
    rank: index + 1,
    userId: row.user_id as string,
    displayName: (row.display_name as string) || "Reader",
    avatarUrl: (row.avatar_url as string | null) ?? undefined,
    xpTotal: (row.xp_total as number) ?? 0,
  }));
};

export const useStreakCloud = () => {
  const auth = useAuth();
  const userId = auth.user?.id;
  const queryClient = useQueryClient();
  const enabled = Boolean(userId && isSupabaseConfigured);

  const streakQuery = useQuery({
    queryKey: streakQueryKey(userId),
    queryFn: () => fetchStreak(userId!),
    enabled,
    staleTime: 30_000,
  });

  const leaderboardQuery = useQuery({
    queryKey: leaderboardQueryKey,
    queryFn: fetchLeaderboard,
    enabled: isSupabaseConfigured,
    staleTime: 120_000,
  });

  const registerVisitMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        return null;
      }

      const today = getLocalDateKey();
      const current = (await fetchStreak(userId)) ?? {
        streakCount: 0,
        lastVisitDate: null,
        leaderboardOptIn: false,
      };

      if (current.lastVisitDate === today) {
        return current;
      }

      const nextStreak =
        current.lastVisitDate === getPreviousDateKey(today)
          ? current.streakCount + 1
          : 1;

      await upsertStreak(userId, { streakCount: nextStreak, lastVisitDate: today });
      return { ...current, streakCount: nextStreak, lastVisitDate: today };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: streakQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: leaderboardQueryKey });
    },
  });

  const optInMutation = useMutation({
    mutationFn: (optIn: boolean) => setLeaderboardOptIn(userId!, optIn),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: streakQueryKey(userId) });
      queryClient.invalidateQueries({ queryKey: leaderboardQueryKey });
    },
  });

  return {
    streak: streakQuery.data,
    leaderboard: leaderboardQuery.data ?? [],
    isLoading: streakQuery.isLoading,
    registerCloudVisit: registerVisitMutation.mutateAsync,
    setLeaderboardOptIn: optInMutation.mutateAsync,
    isCloudEnabled: enabled,
  };
};
