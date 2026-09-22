import { supabase, isSupabaseConfigured } from "./supabaseClient";

export const exportAccountData = async (userId: string) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  const [profile, readings, journal, comments, xpEvents] = await Promise.all([
    supabase.from("user_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("tarot_readings").select("*").eq("user_id", userId),
    supabase.from("tarot_journal_entries").select("*").eq("user_id", userId),
    supabase.from("site_news_comments").select("*").eq("user_id", userId),
    supabase.from("user_xp_events").select("*").eq("user_id", userId),
  ]);

  const errors = [profile, readings, journal, comments, xpEvents]
    .map((result) => result.error)
    .filter(Boolean);

  if (errors.length > 0) {
    throw errors[0];
  }

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: profile.data,
    readings: readings.data ?? [],
    journal: journal.data ?? [],
    comments: comments.data ?? [],
    xpEvents: xpEvents.data ?? [],
  };
};

export const deleteAccountData = async () => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.rpc("delete_my_account_data");

  if (error) {
    throw error;
  }
};

export const downloadAccountDataJson = (payload: unknown, filename = "tarot-account-data.json") => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
};
