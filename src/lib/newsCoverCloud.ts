import { compressNewsCoverFile } from "./compressImage";
import { supabase } from "./supabaseClient";
import { updateNewsCoverUrl } from "./newsCloud";

const NEWS_IMAGES_BUCKET = "news-images";
const ALLOWED_COVER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_COVER_BYTES = 2.5 * 1024 * 1024;

const getCoverExtension = (file: File) => {
  if (file.type === "image/png") {
    return "png";
  }
  if (file.type === "image/webp") {
    return "webp";
  }
  return "jpg";
};

const extractStoragePathFromPublicUrl = (publicUrl: string) => {
  const marker = `/object/public/${NEWS_IMAGES_BUCKET}/`;
  const index = publicUrl.indexOf(marker);
  if (index === -1) {
    return null;
  }
  return decodeURIComponent(publicUrl.slice(index + marker.length));
};

export const uploadNewsCover = async (newsId: string, file: File) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  if (!ALLOWED_COVER_TYPES.has(file.type)) {
    throw new Error("invalid-cover-type");
  }

  const compressed = await compressNewsCoverFile(file);

  if (compressed.size > MAX_COVER_BYTES) {
    throw new Error("cover-too-large");
  }

  const extension = getCoverExtension(compressed);
  const path = `covers/${newsId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(NEWS_IMAGES_BUCKET)
    .upload(path, compressed, { upsert: false, contentType: compressed.type });

  if (uploadError) {
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from(NEWS_IMAGES_BUCKET)
    .getPublicUrl(path);

  await updateNewsCoverUrl(newsId, publicUrlData.publicUrl);

  return publicUrlData.publicUrl;
};

export const removeNewsCover = async (newsId: string, currentUrl?: string | null) => {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  await updateNewsCoverUrl(newsId, null);

  if (currentUrl) {
    const path = extractStoragePathFromPublicUrl(currentUrl);
    if (path) {
      try {
        await supabase.storage.from(NEWS_IMAGES_BUCKET).remove([path]);
      } catch {
        // Best-effort storage cleanup — DB already cleared.
      }
    }
  }
};
