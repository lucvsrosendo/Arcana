import { Injectable, inject, signal } from "@angular/core";
import {
  injectMutation,
  injectQuery,
  injectQueryClient,
} from "@tanstack/angular-query-experimental";
import { XP_RULES } from "@tarot/core";
import { CompressImageService } from "./compress-image.service";
import { SupabaseService } from "./supabase.service";

export type XpEventType = keyof typeof XP_RULES;

export type XpEvent = {
  id: string;
  type: XpEventType;
  amount: number;
  createdAt: string;
};

export type UserProfile = {
  displayName: string;
  avatarUrl?: string;
  bio?: string;
};

const PROFILE_KEY = "tarot:profile";
const XP_KEY = "tarot:xp";
const XP_EVENTS_KEY = "tarot:xp-events";

const readStorage = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === "undefined") {
    return fallback;
  }

  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeStorage = (key: string, value: unknown) => {
  if (typeof localStorage === "undefined") {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
};

const createId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

@Injectable({ providedIn: "root" })
export class ProfileService {
  private readonly supabase = inject(SupabaseService);
  private readonly compressImage = inject(CompressImageService);
  private readonly queryClient = injectQueryClient();

  readonly profile = signal<UserProfile | null>(readStorage<UserProfile | null>(PROFILE_KEY, null));
  readonly xpTotal = signal(readStorage<number>(XP_KEY, 0));
  readonly xpEvents = signal<XpEvent[]>(readStorage<XpEvent[]>(XP_EVENTS_KEY, []));

  profileQuery(userId: string | undefined) {
    return injectQuery(() => ({
      queryKey: ["profile", userId],
      queryFn: () => this.fetchCloudProfile(userId!),
      enabled: Boolean(userId && this.supabase.client),
      staleTime: 60_000,
    }));
  }

  updateProfileMutation(userId: string) {
    return injectMutation(() => ({
      mutationFn: (updates: Partial<UserProfile>) => this.updateCloudProfile(userId, updates),
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      },
    }));
  }

  uploadAvatarMutation(userId: string) {
    return injectMutation(() => ({
      mutationFn: (file: File) => this.uploadAvatar(userId, file),
      onSuccess: () => {
        this.queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      },
    }));
  }

  updateProfile(updates: Partial<UserProfile>) {
    const next = { ...(this.profile() ?? { displayName: "Reader" }), ...updates };
    this.profile.set(next);
    writeStorage(PROFILE_KEY, next);
    return next;
  }

  awardXp(type: XpEventType) {
    const amount = XP_RULES[type];
    const event: XpEvent = {
      id: createId(),
      type,
      amount,
      createdAt: new Date().toISOString(),
    };

    this.xpTotal.update((total) => total + amount);
    this.xpEvents.update((events) => [event, ...events].slice(0, 50));
    writeStorage(XP_KEY, this.xpTotal());
    writeStorage(XP_EVENTS_KEY, this.xpEvents());
    return event;
  }

  async fetchCloudProfile(userId: string) {
    if (!this.supabase.client) {
      return null;
    }

    const { data, error } = await this.supabase.client
      .from("user_profiles")
      .select("display_name, avatar_url, xp_total")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  }

  async syncFromCloud(userId: string) {
    try {
      const data = await this.fetchCloudProfile(userId);
      if (!data) {
        return;
      }

      this.profile.set({
        displayName: data.display_name ?? "Reader",
        avatarUrl: data.avatar_url ?? undefined,
      });

      if (typeof data.xp_total === "number") {
        this.xpTotal.set(data.xp_total);
        writeStorage(XP_KEY, data.xp_total);
      }

      writeStorage(PROFILE_KEY, this.profile());
    } catch (error) {
      console.warn("[ProfileService] cloud sync failed:", error);
    }
  }

  async updateCloudProfile(userId: string, updates: Partial<UserProfile>) {
    const next = this.updateProfile(updates);

    if (!this.supabase.client) {
      return next;
    }

    const { error } = await this.supabase.client
      .from("user_profiles")
      .upsert({
        user_id: userId,
        display_name: next.displayName,
        avatar_url: next.avatarUrl ?? null,
      });

    if (error) {
      throw error;
    }

    return next;
  }

  async uploadAvatar(userId: string, file: File) {
    const compressed = await this.compressImage.compress(file);
    const avatarUrl = await this.supabase.uploadAvatar(userId, compressed);
    return this.updateCloudProfile(userId, { avatarUrl });
  }
}
