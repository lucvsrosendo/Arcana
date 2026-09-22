-- Cover/banner image URL for site news articles.
-- Required for news cover uploads (admin panel → news-images bucket → this column).
-- Apply in Supabase SQL Editor if cover upload fails with cover-column-missing.
alter table public.site_news
  add column if not exists cover_image_url text;
