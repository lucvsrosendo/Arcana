import { createClient } from "@supabase/supabase-js";

export const normalizeSupabaseUrl = (value: string | undefined) => {
  if (!value) {
    return undefined;
  }

  return value.trim().replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");
};

export const isClientSafeKey = (value: string | undefined) => {
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

const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(
  supabaseUrl && isClientSafeKey(supabaseAnonKey),
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
