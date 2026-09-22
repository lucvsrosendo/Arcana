-- Sync legacy Supabase projects with the current app schema.
-- Safe to run multiple times (uses IF NOT EXISTS).

alter table public.tarot_readings
  add column if not exists question text null;

alter table public.tarot_journal_entries
  add column if not exists manifestation text null;

alter table public.tarot_journal_entries
  add column if not exists tags jsonb not null default '[]'::jsonb;

-- Journal / reading XP triggers + claim RPC (idempotent)
-- Full file also at supabase/patches/20260714_journal_reading_xp.sql

-- Long-form news body (markdown)
alter table public.site_news
  add column if not exists body_pt text not null default '',
  add column if not exists body_en text not null default '',
  add column if not exists body_es text not null default '';

-- Ensure news editor RLS policies exist (safe to re-run)
alter table public.site_news enable row level security;

drop policy if exists "Editors can insert site news" on public.site_news;
create policy "Editors can insert site news"
on public.site_news for insert
with check (
  exists (
    select 1
    from public.site_news_admins admins
    where admins.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.site_news_moderators moderators
    where moderators.user_id = auth.uid()
  )
);

drop policy if exists "Editors can update site news" on public.site_news;
create policy "Editors can update site news"
on public.site_news for update
using (
  exists (
    select 1
    from public.site_news_admins admins
    where admins.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.site_news_moderators moderators
    where moderators.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.site_news_admins admins
    where admins.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.site_news_moderators moderators
    where moderators.user_id = auth.uid()
  )
);

drop policy if exists "Editors can delete site news" on public.site_news;
create policy "Editors can delete site news"
on public.site_news for delete
using (
  exists (
    select 1
    from public.site_news_admins admins
    where admins.user_id = auth.uid()
  )
  or exists (
    select 1
    from public.site_news_moderators moderators
    where moderators.user_id = auth.uid()
  )
);

-- Full profile/XP stack lives in supabase/schema.sql (from line ~402).
-- Run that section in the SQL Editor if user_profiles is missing.
