import { supabase, isSupabaseConfigured } from "./supabaseClient";
import type { SiteNewsItem } from "../data/siteNews";
import type { LanguageCode } from "../types/tarot";

type NewsRow = {
  id: string;
  date: string;
  tag_pt: string;
  tag_en: string;
  tag_es: string;
  title_pt: string;
  title_en: string;
  title_es: string;
  summary_pt: string;
  summary_en: string;
  summary_es: string;
  body_pt?: string | null;
  body_en?: string | null;
  body_es?: string | null;
  cover_image_url?: string | null;
  created_at: string;
};

export type CloudNewsRecord = NewsRow;

const CLOUD_NEWS_LIMIT = 20;

const BASE_NEWS_SELECT =
  "id, date, tag_pt, tag_en, tag_es, title_pt, title_en, title_es, summary_pt, summary_en, summary_es, created_at";

const LEGACY_NEWS_SELECT = BASE_NEWS_SELECT;
const LEGACY_WITH_COVER_SELECT = `${BASE_NEWS_SELECT}, cover_image_url`;
const FULL_NEWS_SELECT = `${BASE_NEWS_SELECT}, body_pt, body_en, body_es`;
const FULL_WITH_COVER_SELECT = `${FULL_NEWS_SELECT}, cover_image_url`;

const NEWS_SELECT_ATTEMPTS = [
  FULL_WITH_COVER_SELECT,
  FULL_NEWS_SELECT,
  LEGACY_WITH_COVER_SELECT,
  LEGACY_NEWS_SELECT,
] as const;

const isMissingColumnError = (error: { message?: string } | null, column: string) => {
  const message = error?.message?.toLowerCase() ?? "";
  const normalizedColumn = column.toLowerCase();

  return (
    message.includes(`${normalizedColumn} does not exist`) ||
    message.includes(`.${normalizedColumn} does not exist`)
  );
};

const isRetryableMissingColumn = (error: { message?: string } | null) =>
  ["body_pt", "body_en", "body_es", "cover_image_url"].some((column) =>
    isMissingColumnError(error, column),
  );

const normalizeNewsRow = (row: NewsRow): NewsRow => ({
  ...row,
  body_pt: row.body_pt ?? "",
  body_en: row.body_en ?? "",
  body_es: row.body_es ?? "",
  cover_image_url: row.cover_image_url ?? null,
});

const fetchNewsRows = async () => {
  if (!supabase) {
    return { data: [] as NewsRow[], error: null };
  }

  for (const select of NEWS_SELECT_ATTEMPTS) {
    const result = await supabase
      .from("site_news")
      .select(select)
      .order("created_at", { ascending: false })
      .limit(CLOUD_NEWS_LIMIT);

    if (!result.error) {
      return {
        data: (result.data ?? []).map((row) => normalizeNewsRow(row as unknown as NewsRow)),
        error: null,
      };
    }

    if (!isRetryableMissingColumn(result.error)) {
      return { data: null, error: result.error };
    }
  }

  return { data: [], error: null };
};

export type CreateNewsPayload = {
  date: string;
  tag: Record<LanguageCode, string>;
  title: Record<LanguageCode, string>;
  summary: Record<LanguageCode, string>;
  body?: Partial<Record<LanguageCode, string>>;
  coverImageUrl?: string | null;
};

export const isMissingTableError = (error: { message?: string; code?: string } | null) => {
  const message = error?.message?.toLowerCase() ?? "";
  return error?.code === "PGRST205" || message.includes("could not find the table");
};

export const formatNewsCloudError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return "";
  }

  const record = error as { message?: string; code?: string; details?: string; hint?: string };
  const parts = [record.message, record.details, record.hint].filter(Boolean);
  return parts.join(" - ");
};

const bodyFieldsFromPayload = (payload: CreateNewsPayload) => ({
  body_pt: payload.body?.pt?.trim() ?? "",
  body_en: payload.body?.en?.trim() ?? payload.body?.pt?.trim() ?? "",
  body_es: payload.body?.es?.trim() ?? payload.body?.pt?.trim() ?? "",
});

const buildNewsRowPayload = (
  payload: CreateNewsPayload,
  options: { includeBody: boolean; includeCover: boolean },
) => {
  const row: Record<string, string | null> = {
    date: payload.date,
    tag_pt: payload.tag.pt,
    tag_en: payload.tag.en,
    tag_es: payload.tag.es,
    title_pt: payload.title.pt,
    title_en: payload.title.en,
    title_es: payload.title.es,
    summary_pt: payload.summary.pt,
    summary_en: payload.summary.en,
    summary_es: payload.summary.es,
  };

  if (options.includeBody) {
    Object.assign(row, bodyFieldsFromPayload(payload));
  }

  if (options.includeCover && payload.coverImageUrl !== undefined) {
    row.cover_image_url = payload.coverImageUrl;
  }

  return row;
};

const writeNewsRow = async (
  mode: "insert" | "update",
  payload: CreateNewsPayload,
  newsId?: string,
): Promise<string | void> => {
  if (!supabase) {
    return;
  }

  const attempts: Array<{ includeBody: boolean; includeCover: boolean }> = [
    { includeBody: true, includeCover: true },
    { includeBody: true, includeCover: false },
    { includeBody: false, includeCover: true },
    { includeBody: false, includeCover: false },
  ];

  for (const options of attempts) {
    const rowPayload = buildNewsRowPayload(payload, options);
    const result =
      mode === "insert"
        ? await supabase.from("site_news").insert(rowPayload).select("id").single()
        : await supabase.from("site_news").update(rowPayload).eq("id", newsId!).select("id").single();

    if (!result.error) {
      return (result.data as { id: string } | null)?.id;
    }

    if (!isRetryableMissingColumn(result.error)) {
      throw result.error;
    }
  }
};

const rowToItem = (row: NewsRow, language: LanguageCode): SiteNewsItem => {
  const body = row[`body_${language}`] ?? row.body_pt;
  const trimmedBody = typeof body === "string" ? body.trim() : "";
  const coverImageUrl = row.cover_image_url?.trim() || null;

  return {
    id: row.id,
    date: row.date,
    tag: row[`tag_${language}`] ?? row.tag_pt,
    title: row[`title_${language}`] ?? row.title_pt,
    summary: row[`summary_${language}`] ?? row.summary_pt,
    ...(trimmedBody ? { body: trimmedBody } : {}),
    ...(coverImageUrl ? { coverImageUrl } : {}),
  };
};

export const fetchCloudNews = async (
  language: LanguageCode,
): Promise<SiteNewsItem[] | null> => {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await fetchNewsRows();

  if (error) {
    console.warn("[newsCloud] fetch failed:", error.message);
    return null;
  }

  return data.map((row) => rowToItem(row, language));
};

export const fetchCloudNewsById = async (
  newsId: string,
  language: LanguageCode,
): Promise<SiteNewsItem | null> => {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  for (const select of NEWS_SELECT_ATTEMPTS) {
    const { data, error } = await supabase
      .from("site_news")
      .select(select)
      .eq("id", newsId)
      .maybeSingle();

    if (!error) {
      if (!data) {
        return null;
      }

      return rowToItem(normalizeNewsRow(data as unknown as NewsRow), language);
    }

    if (!isRetryableMissingColumn(error)) {
      return null;
    }
  }

  return null;
};

export const fetchCloudNewsRaw = async (): Promise<CloudNewsRecord[]> => {
  if (!supabase) {
    return [];
  }

  const { data, error } = await fetchNewsRows();

  if (error) {
    throw error;
  }

  return data;
};

export const saveNewsToCloud = async (payload: CreateNewsPayload) => {
  const id = await writeNewsRow("insert", payload);
  return id ?? null;
};

export const deleteNewsFromCloud = async (newsId: string) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("site_news")
    .delete()
    .eq("id", newsId);

  if (error) {
    throw error;
  }
};

export const updateNewsInCloud = async (
  newsId: string,
  payload: CreateNewsPayload,
) => {
  await writeNewsRow("update", payload, newsId);
};

export const updateNewsCoverUrl = async (
  newsId: string,
  coverImageUrl: string | null,
) => {
  if (!supabase) {
    return;
  }

  const { error } = await supabase
    .from("site_news")
    .update({ cover_image_url: coverImageUrl })
    .eq("id", newsId);

  if (error) {
    if (isMissingColumnError(error, "cover_image_url")) {
      throw new Error("cover-column-missing");
    }
    throw error;
  }
};
