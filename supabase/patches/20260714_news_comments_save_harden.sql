-- Create + harden news comments for normal authenticated users.
-- Safe to run multiple times.
-- Fixes PostgREST 404 / PGRST205 on /rest/v1/site_news_comments

-- ---------------------------------------------------------------------------
-- 1) Parent tables
-- ---------------------------------------------------------------------------
create table if not exists public.site_news_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_news_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.site_news (
  id uuid primary key default gen_random_uuid(),
  date text not null,
  tag_pt text not null default '',
  tag_en text not null default '',
  tag_es text not null default '',
  title_pt text not null,
  title_en text not null default '',
  title_es text not null default '',
  summary_pt text not null,
  summary_en text not null default '',
  summary_es text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2) Comments table (the missing piece for the 404)
-- ---------------------------------------------------------------------------
create table if not exists public.site_news_comments (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.site_news(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid null references public.site_news_comments(id) on delete cascade,
  author_display_name text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- If table already existed without parent_id, add it now
alter table public.site_news_comments
  add column if not exists parent_id uuid;

do $$
begin
  alter table public.site_news_comments
    add constraint site_news_comments_parent_id_fkey
    foreign key (parent_id)
    references public.site_news_comments(id)
    on delete cascade;
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter table public.site_news_comments
    add constraint site_news_comments_body_not_blank
    check (length(trim(body)) > 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.site_news_comments
    add constraint site_news_comments_body_max_length
    check (length(body) <= 2000);
exception
  when duplicate_object then null;
end $$;

create index if not exists site_news_comments_news_created_at_idx
on public.site_news_comments (news_id, created_at asc);

create index if not exists site_news_comments_parent_id_idx
on public.site_news_comments (parent_id);

create or replace function public.set_site_news_comments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists site_news_comments_set_updated_at
on public.site_news_comments;

create trigger site_news_comments_set_updated_at
before update on public.site_news_comments
for each row
execute procedure public.set_site_news_comments_updated_at();

-- ---------------------------------------------------------------------------
-- 3) Grants + RLS
-- ---------------------------------------------------------------------------
grant select on public.site_news to anon, authenticated;
grant select, insert, update, delete on public.site_news_comments to authenticated;
grant select on public.site_news_comments to anon;

alter table public.site_news enable row level security;
alter table public.site_news_comments enable row level security;

drop policy if exists "Public can read site news"
on public.site_news;

create policy "Public can read site news"
on public.site_news for select
using (true);

drop policy if exists "Public can read site news comments"
on public.site_news_comments;

create policy "Public can read site news comments"
on public.site_news_comments for select
using (true);

drop policy if exists "Users can insert their site news comments"
on public.site_news_comments;

create policy "Users can insert their site news comments"
on public.site_news_comments for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their site news comments"
on public.site_news_comments;

create policy "Users can update their site news comments"
on public.site_news_comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users and editors can delete site news comments"
on public.site_news_comments;

create policy "Users and editors can delete site news comments"
on public.site_news_comments for delete
using (
  auth.uid() = user_id
  or exists (
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

-- ---------------------------------------------------------------------------
-- 4) XP helpers (comment insert must not fail when XP is broken)
-- ---------------------------------------------------------------------------
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text null,
  xp_total integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  points integer not null,
  source_id uuid not null,
  created_at timestamptz not null default now()
);

create unique index if not exists user_xp_events_user_event_source_uidx
on public.user_xp_events (user_id, event_type, source_id);

create or replace function public.ensure_user_profile_row(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.user_profiles (user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
exception
  when others then
    null;
end;
$$;

create or replace function public.award_xp(
  p_user_id uuid,
  p_event_type text,
  p_points integer,
  p_source_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted_id uuid;
begin
  if p_user_id is null or p_points <= 0 or p_source_id is null then
    return;
  end if;

  perform public.ensure_user_profile_row(p_user_id);

  insert into public.user_xp_events (user_id, event_type, points, source_id)
  values (p_user_id, p_event_type, p_points, p_source_id)
  on conflict (user_id, event_type, source_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is not null then
    update public.user_profiles
    set xp_total = coalesce(xp_total, 0) + p_points
    where user_id = p_user_id;
  end if;
exception
  when others then
    null;
end;
$$;

create or replace function public.on_site_news_comment_created_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.award_xp(new.user_id, 'comment_created', 15, new.id);
  exception
    when others then
      null;
  end;
  return new;
end;
$$;

drop trigger if exists site_news_comments_award_xp on public.site_news_comments;

create trigger site_news_comments_award_xp
after insert on public.site_news_comments
for each row
execute procedure public.on_site_news_comment_created_award_xp();

-- Make the new table visible to the REST API
notify pgrst, 'reload schema';
