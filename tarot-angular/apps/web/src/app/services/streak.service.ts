import { Injectable, inject } from "@angular/core";
import { injectMutation, injectQuery, injectQueryClient } from "@tanstack/angular-query-experimental";
import { SupabaseService } from "./supabase.service";

export type UserStreak = {
  streakCount: number;
  lastVisitDate: string | null;
  leaderboardOptIn: boolean;
};

@Injectable({ providedIn: "root" })
export class StreakService {
  private readonly supabase = inject(SupabaseService);
  private readonly queryClient = injectQueryClient();

  streakQuery(userId: string | undefined) {
    return injectQuery(() => ({
      queryKey: ["user-streak", userId],
      queryFn: () => this.fetchStreak(userId!),
      enabled: Boolean(userId && this.supabase.client),
      staleTime: 30_000,
    }));
  }

  upsertStreakMutation(userId: string) {
    return injectMutation(() => ({
      mutationFn: (input: { streakCount: number; lastVisitDate: string }) =>
        this.upsertStreak(userId, input),
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ["user-streak", userId] });
        this.queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      },
    }));
  }

  leaderboardQuery() {
    return injectQuery(() => ({
      queryKey: ["leaderboard"],
      queryFn: () => this.fetchLeaderboard(),
      enabled: Boolean(this.supabase.client),
      staleTime: 120_000,
    }));
  }

  async fetchStreak(userId: string): Promise<UserStreak | null> {
    if (!this.supabase.client) {
      return null;
    }

    const { data, error } = await this.supabase.client
      .from("user_streaks")
      .select("streak_count, last_visit_date, leaderboard_opt_in")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[StreakService] fetch failed:", error.message);
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
  }

  async upsertStreak(
    userId: string,
    input: { streakCount: number; lastVisitDate: string },
  ) {
    if (!this.supabase.client) {
      return;
    }

    const { error } = await this.supabase.client.from("user_streaks").upsert({
      user_id: userId,
      streak_count: input.streakCount,
      last_visit_date: input.lastVisitDate,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }
  }

  async setLeaderboardOptIn(userId: string, optIn: boolean) {
    if (!this.supabase.client) {
      return;
    }

    const { error } = await this.supabase.client.from("user_streaks").upsert({
      user_id: userId,
      leaderboard_opt_in: optIn,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      throw error;
    }

    this.queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
  }

  async fetchLeaderboard() {
    if (!this.supabase.client) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from("user_profiles")
      .select("user_id, display_name, avatar_url, xp_total")
      .order("xp_total", { ascending: false })
      .limit(10);

    if (error) {
      console.warn("[StreakService] leaderboard failed:", error.message);
      return [];
    }

    return (data ?? []).map((row, index) => ({
      rank: index + 1,
      userId: row.user_id as string,
      displayName: row.display_name || "Reader",
      avatarUrl: row.avatar_url ?? undefined,
      xpTotal: row.xp_total ?? 0,
    }));
  }
}
