import { Injectable, inject } from "@angular/core";
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

    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return data.session;
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

  async hasNewsEditorRole(userId: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    const [adminResult, moderatorResult] = await Promise.all([
      this.client
        .from("site_news_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle(),
      this.client
        .from("site_news_moderators")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (adminResult.error && adminResult.error.code !== "PGRST116") {
      console.warn("[SupabaseService] admin lookup failed:", adminResult.error.message);
    }

    if (moderatorResult.error && moderatorResult.error.code !== "PGRST116") {
      console.warn(
        "[SupabaseService] moderator lookup failed:",
        moderatorResult.error.message,
      );
    }

    return Boolean(adminResult.data || moderatorResult.data);
  }
}
