-- MINIMAL: cria public.site_news_comments (corrige 404 / PGRST205)
-- Cole no Supabase → SQL Editor → Run
-- Requer que public.site_news ja exista (ja existe no seu projeto).

create table if not exists public.site_news_comments (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.site_news(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.site_news_comments
  add column if not exists parent_id uuid;

create index if not exists site_news_comments_news_created_at_idx
on public.site_news_comments (news_id, created_at asc);

create index if not exists site_news_comments_parent_id_idx
on public.site_news_comments (parent_id);

grant select, insert, update, delete on public.site_news_comments to authenticated;
grant select on public.site_news_comments to anon;

alter table public.site_news_comments enable row level security;

drop policy if exists "Public can read site news comments" on public.site_news_comments;
create policy "Public can read site news comments"
on public.site_news_comments for select using (true);

drop policy if exists "Users can insert their site news comments" on public.site_news_comments;
create policy "Users can insert their site news comments"
on public.site_news_comments for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their site news comments" on public.site_news_comments;
create policy "Users can update their site news comments"
on public.site_news_comments for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete their site news comments" on public.site_news_comments;
create policy "Users can delete their site news comments"
on public.site_news_comments for delete using (auth.uid() = user_id);

notify pgrst, 'reload schema';

-- Confirme: deve retornar site_news_comments
select to_regclass('public.site_news_comments') as created;
