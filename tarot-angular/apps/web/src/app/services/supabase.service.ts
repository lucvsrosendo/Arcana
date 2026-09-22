import { Injectable } from "@angular/core";
import {
  AuthChangeEvent,
  Session,
  SupabaseClient,
  User,
  createClient,
} from "@supabase/supabase-js";

const normalizeSupabaseUrl = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  return value.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
};

const isClientSafeKey = (value: string | undefined) => {
  if (!value) {
    return false;
  }

  const key = value.trim();
  return (
    key.startsWith("ey") ||
    key.startsWith("sb_publishable_") ||
    key.startsWith("sb_anon_")
  );
};

@Injectable({ providedIn: "root" })
export class SupabaseService {
  readonly isConfigured: boolean;
  readonly client: SupabaseClient | null;

  constructor() {
    const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
    this.isConfigured = Boolean(url && isClientSafeKey(anonKey));
    this.client = this.isConfigured
      ? createClient(url!, anonKey!, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        })
      : null;
  }

  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    if (!this.client) {
      return { data: { subscription: { unsubscribe: () => undefined } } };
    }

    return this.client.auth.onAuthStateChange(callback);
  }

  async getSession(): Promise<Session | null> {
    if (!this.client) {
      return null;
    }

    const { data, error } = await this.client.auth.getSession();
    if (error) {
      console.warn("[SupabaseService] getSession failed:", error.message);
      return null;
    }

    return data.session;
  }

  async getUser(): Promise<User | null> {
    const session = await this.getSession();
    return session?.user ?? null;
  }

  async signInWithPassword(email: string, password: string) {
    if (!this.client) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }

    return data.session;
  }

  async signUp(email: string, password: string) {
    if (!this.client) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await this.client.auth.signUp({ email, password });
    if (error) {
      throw error;
    }

    return data;
  }

  async signInWithOAuth(provider: "google" | "github") {
    if (!this.client) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await this.client.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/settings`,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async verifyEmailOtp(email: string, token: string) {
    if (!this.client) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await this.client.auth.verifyOtp({
      email,
      token,
      type: "email",
    });

    if (error) {
      throw error;
    }

    return data.session;
  }

  async uploadAvatar(userId: string, file: Blob) {
    if (!this.client) {
      throw new Error("Supabase is not configured.");
    }

    const path = `${userId}/avatar-${Date.now()}.jpg`;
    const { error: uploadError } = await this.client.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: "image/jpeg" });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = this.client.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  }

  async signOut() {
    if (!this.client) {
      return;
    }

    const { error } = await this.client.auth.signOut();
    if (error) {
      throw error;
    }
  }
}
