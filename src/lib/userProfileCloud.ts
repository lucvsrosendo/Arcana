import Compressor from "compressorjs";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UserProfile = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  xpTotal: number;
  createdAt: string;
  updatedAt: string;
};

export type XpEvent = {
  id: string;
  eventType: string;
  points: number;
  sourceId: string;
  createdAt: string;
};

type ProfileRow = {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  xp_total: number;
  created_at: string;
  updated_at: string;
};

const rowToProfile = (row: ProfileRow): UserProfile => ({
  userId: row.user_id,
  displayName: row.display_name,
  avatarUrl: row.avatar_url,
  xpTotal: row.xp_total,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const isMissingProfileSchemaError = (error: { message?: string; code?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST202" ||
    error?.code === "PGRST205" ||
    message.includes("user_profiles") ||
    message.includes("ensure_user_profile") ||
    message.includes("could not find the table")
  );
};

const isMissingXpEventsSchemaError = (error: { message?: string; code?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "PGRST205" ||
    message.includes("user_xp_events") ||
    message.includes("could not find the table")
  );
};

export const ensureUserProfile = async (): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("ensure_user_profile");

  if (error) {
    if (isMissingProfileSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return rowToProfile(data as ProfileRow);
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (isMissingProfileSchemaError(error)) {
      return null;
    }

    throw error;
  }

  return data ? rowToProfile(data as ProfileRow) : null;
};

export const updateUserProfile = async (
  userId: string,
  updates: { displayName?: string; avatarUrl?: string | null },
) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const payload: Partial<ProfileRow> = {};
  if (updates.displayName !== undefined) {
    payload.display_name = updates.displayName;
  }
  if (updates.avatarUrl !== undefined) {
    payload.avatar_url = updates.avatarUrl;
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({ user_id: userId, ...payload }, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return rowToProfile(data as ProfileRow);
};

export const fetchRecentXpEvents = async (userId: string, limit = 10): Promise<XpEvent[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("user_xp_events")
    .select("id, event_type, points, source_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingXpEventsSchemaError(error)) {
      return [];
    }
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    eventType: row.event_type as string,
    points: row.points as number,
    sourceId: row.source_id as string,
    createdAt: row.created_at as string,
  }));
};

const getAvatarExtension = (file: File) => {
  if (file.type === "image/png") {
    return "png";
  }
  if (file.type === "image/webp") {
    return "webp";
  }
  return "jpg";
};

const compressAvatarIfNeeded = (file: File) =>
  new Promise<File>((resolve, reject) => {
    if (file.size <= MAX_AVATAR_BYTES) {
      resolve(file);
      return;
    }

    new Compressor(file, {
      quality: 0.82,
      maxWidth: 512,
      maxHeight: 512,
      convertSize: MAX_AVATAR_BYTES,
      success(result) {
        const compressed =
          result instanceof File
            ? result
            : new File([result], file.name, { type: result.type || file.type });
        resolve(compressed);
      },
      error(error) {
        reject(error);
      },
    });
  });

export const uploadUserAvatar = async (userId: string, file: File) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    throw new Error("invalid-avatar-type");
  }

  const compressed = await compressAvatarIfNeeded(file);

  if (compressed.size > MAX_AVATAR_BYTES) {
    throw new Error("avatar-too-large");
  }

  const extension = getAvatarExtension(compressed);
  const path = `${userId}/avatar.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, compressed, { upsert: true, contentType: compressed.type });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

  return updateUserProfile(userId, { avatarUrl: publicUrlData.publicUrl });
};

export const removeUserAvatar = async (userId: string) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const extensions = ["jpg", "png", "webp"];
  await Promise.all(
    extensions.map((extension) =>
      supabase!.storage.from(AVATAR_BUCKET).remove([`${userId}/avatar.${extension}`]),
    ),
  );

  return updateUserProfile(userId, { avatarUrl: null });
};
