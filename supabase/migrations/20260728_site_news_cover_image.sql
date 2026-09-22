-- Cover/banner image URL for site news articles.
-- Required for news cover uploads (admin panel → news-images bucket → this column).
alter table public.site_news
  add column if not exists cover_image_url text;
