import { Injectable, computed, inject, signal } from "@angular/core";
import type { Session, User } from "@supabase/supabase-js";
import { SupabaseService } from "./supabase.service";
import { ProfileService } from "./profile.service";
import { StreakService } from "./streak.service";
import { TarotStateService } from "./tarot-state.service";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly supabase = inject(SupabaseService);
  private readonly profile = inject(ProfileService);
  private readonly streak = inject(StreakService);
  private readonly tarotState = inject(TarotStateService);

  readonly session = signal<Session | null>(null);
  readonly user = computed(() => this.session()?.user ?? null);
  readonly isConfigured = computed(() => this.supabase.isConfigured);
  readonly isAuthenticated = computed(() => Boolean(this.session()));

  constructor() {
    void this.hydrate();
    this.supabase.onAuthStateChange((_event, session) => {
      this.session.set(session);
      if (session?.user?.id) {
        void this.profile.syncFromCloud(session.user.id);
        void this.syncCloudStreak(session.user.id);
      }
    });
  }

  async hydrate() {
    const session = await this.supabase.getSession();
    this.session.set(session);

    if (session?.user?.id) {
      await this.profile.syncFromCloud(session.user.id);
      await this.syncCloudStreak(session.user.id);
    }
  }

  async signIn(email: string, password: string) {
    const session = await this.supabase.signInWithPassword(email, password);
    this.session.set(session);
    return session;
  }

  async signUp(email: string, password: string) {
    return this.supabase.signUp(email, password);
  }

  async signInWithGoogle() {
    return this.supabase.signInWithOAuth("google");
  }

  async signInWithGitHub() {
    return this.supabase.signInWithOAuth("github");
  }

  async verifyOtp(email: string, token: string) {
    const session = await this.supabase.verifyEmailOtp(email, token);
    this.session.set(session);
    return session;
  }

  async signOut() {
    await this.supabase.signOut();
    this.session.set(null);
  }

  getDisplayName(): string {
    const profileName = this.profile.profile()?.displayName;
    if (profileName?.trim()) {
      return profileName.trim();
    }

    const user = this.user() as User | null;
    return user?.email?.split("@")[0] ?? "Reader";
  }

  private async syncCloudStreak(userId: string) {
    const cloud = await this.streak.fetchStreak(userId);
    if (!cloud) {
      return;
    }

    const localCount = this.tarotState.dailyStreak();
    const merged = Math.max(localCount, cloud.streakCount);
    this.tarotState.setDailyStreak(merged, cloud.lastVisitDate);

    if (merged > cloud.streakCount) {
      await this.streak.upsertStreak(userId, {
        streakCount: merged,
        lastVisitDate: this.tarotState.dailyStreakLastDate() ?? new Date().toISOString().slice(0, 10),
      });
    }
  }
}
