-- Full XP stack + comments cloud (idempotent).
-- Fixes missing user_profiles / user_xp_events / site_news_comments (PGRST205)
-- and wires all award triggers aligned with src/data/xpRules.ts

-- =============================================================================
-- 1) Parent / comments tables (exit local-comment fallback)
-- =============================================================================
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

alter table public.site_news
  add column if not exists body_pt text not null default '',
  add column if not exists body_en text not null default '',
  add column if not exists body_es text not null default '';

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

drop trigger if exists site_news_comments_set_updated_at on public.site_news_comments;
create trigger site_news_comments_set_updated_at
before update on public.site_news_comments
for each row
execute procedure public.set_site_news_comments_updated_at();

grant select on public.site_news to anon, authenticated;
grant select, insert, update, delete on public.site_news_comments to authenticated;
grant select on public.site_news_comments to anon;

alter table public.site_news enable row level security;
alter table public.site_news_comments enable row level security;

drop policy if exists "Public can read site news" on public.site_news;
create policy "Public can read site news"
on public.site_news for select using (true);

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

drop policy if exists "Users and editors can delete site news comments" on public.site_news_comments;
drop policy if exists "Users can delete their site news comments" on public.site_news_comments;
create policy "Users and editors can delete site news comments"
on public.site_news_comments for delete
using (
  auth.uid() = user_id
  or exists (select 1 from public.site_news_admins a where a.user_id = auth.uid())
  or exists (select 1 from public.site_news_moderators m where m.user_id = auth.uid())
);

-- =============================================================================
-- 2) Profiles + XP ledger
-- =============================================================================
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  xp_total integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  alter table public.user_profiles
    add constraint user_profiles_xp_total_non_negative
    check (xp_total >= 0);
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_user_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute procedure public.set_user_profiles_updated_at();

grant select on public.user_profiles to anon, authenticated;
grant insert, update on public.user_profiles to authenticated;

alter table public.user_profiles enable row level security;

drop policy if exists "Public can read user profiles" on public.user_profiles;
create policy "Public can read user profiles"
on public.user_profiles for select using (true);

drop policy if exists "Users can insert their profile" on public.user_profiles;
create policy "Users can insert their profile"
on public.user_profiles for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update their profile" on public.user_profiles;
create policy "Users can update their profile"
on public.user_profiles for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

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

create index if not exists user_xp_events_user_created_at_idx
on public.user_xp_events (user_id, created_at desc);

grant select on public.user_xp_events to authenticated;

alter table public.user_xp_events enable row level security;

drop policy if exists "Users can read their xp events" on public.user_xp_events;
create policy "Users can read their xp events"
on public.user_xp_events for select using (auth.uid() = user_id);

-- =============================================================================
-- 3) Likes / favorites (XP via triggers)
-- =============================================================================
create table if not exists public.site_news_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.site_news_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists site_news_comment_likes_comment_idx
on public.site_news_comment_likes (comment_id);

grant select on public.site_news_comment_likes to anon, authenticated;

alter table public.site_news_comment_likes enable row level security;

drop policy if exists "Public can read comment likes" on public.site_news_comment_likes;
create policy "Public can read comment likes"
on public.site_news_comment_likes for select using (true);

create table if not exists public.site_news_comment_favorites (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.site_news_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists site_news_comment_favorites_comment_idx
on public.site_news_comment_favorites (comment_id);

grant select on public.site_news_comment_favorites to anon, authenticated;

alter table public.site_news_comment_favorites enable row level security;

drop policy if exists "Public can read comment favorites" on public.site_news_comment_favorites;
create policy "Public can read comment favorites"
on public.site_news_comment_favorites for select using (true);

-- =============================================================================
-- 4) Core XP helpers
-- =============================================================================
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

create or replace function public.revoke_xp(
  p_user_id uuid,
  p_event_type text,
  p_source_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points integer;
begin
  if p_user_id is null or p_source_id is null then
    return;
  end if;

  select points
  into v_points
  from public.user_xp_events
  where user_id = p_user_id
    and event_type = p_event_type
    and source_id = p_source_id;

  if v_points is null then
    return;
  end if;

  delete from public.user_xp_events
  where user_id = p_user_id
    and event_type = p_event_type
    and source_id = p_source_id;

  update public.user_profiles
  set xp_total = greatest(0, coalesce(xp_total, 0) - v_points)
  where user_id = p_user_id;
exception
  when others then
    null;
end;
$$;

create or replace function public.ensure_user_profile()
returns public.user_profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_profile public.user_profiles;
begin
  if v_user_id is null then
    raise exception 'login-required';
  end if;

  perform public.ensure_user_profile_row(v_user_id);

  select *
  into v_profile
  from public.user_profiles
  where user_id = v_user_id;

  return v_profile;
end;
$$;

grant execute on function public.ensure_user_profile() to authenticated;

-- =============================================================================
-- 5) Comment / like / favorite XP triggers
-- =============================================================================
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

create or replace function public.on_comment_like_xp_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  begin
    if tg_op = 'INSERT' then
      select user_id into v_author_id
      from public.site_news_comments where id = new.comment_id;

      if v_author_id is null or v_author_id = new.user_id then
        return new;
      end if;

      perform public.award_xp(new.user_id, 'like_given', 3, new.id);
      perform public.award_xp(v_author_id, 'like_received', 6, new.id);
      return new;
    end if;

    select user_id into v_author_id
    from public.site_news_comments where id = old.comment_id;

    perform public.revoke_xp(old.user_id, 'like_given', old.id);
    if v_author_id is not null and v_author_id <> old.user_id then
      perform public.revoke_xp(v_author_id, 'like_received', old.id);
    end if;
    return old;
  exception
    when others then
      if tg_op = 'INSERT' then
        return new;
      end if;
      return old;
  end;
end;
$$;

drop trigger if exists site_news_comment_likes_xp_change on public.site_news_comment_likes;
create trigger site_news_comment_likes_xp_change
after insert or delete on public.site_news_comment_likes
for each row
execute procedure public.on_comment_like_xp_change();

create or replace function public.on_comment_favorite_xp_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  begin
    if tg_op = 'INSERT' then
      select user_id into v_author_id
      from public.site_news_comments where id = new.comment_id;

      if v_author_id is null or v_author_id = new.user_id then
        return new;
      end if;

      perform public.award_xp(new.user_id, 'favorite_given', 4, new.id);
      perform public.award_xp(v_author_id, 'favorite_received', 12, new.id);
      return new;
    end if;

    select user_id into v_author_id
    from public.site_news_comments where id = old.comment_id;

    perform public.revoke_xp(old.user_id, 'favorite_given', old.id);
    if v_author_id is not null and v_author_id <> old.user_id then
      perform public.revoke_xp(v_author_id, 'favorite_received', old.id);
    end if;
    return old;
  exception
    when others then
      if tg_op = 'INSERT' then
        return new;
      end if;
      return old;
  end;
end;
$$;

drop trigger if exists site_news_comment_favorites_xp_change on public.site_news_comment_favorites;
create trigger site_news_comment_favorites_xp_change
after insert or delete on public.site_news_comment_favorites
for each row
execute procedure public.on_comment_favorite_xp_change();

create or replace function public.toggle_comment_like(p_comment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_author_id uuid;
  v_existing_id uuid;
  v_liked boolean;
  v_like_count integer;
begin
  if v_user_id is null then
    raise exception 'login-required';
  end if;

  select user_id into v_author_id
  from public.site_news_comments where id = p_comment_id;

  if v_author_id is null then
    raise exception 'comment-not-found';
  end if;

  if v_author_id = v_user_id then
    raise exception 'self-interaction-blocked';
  end if;

  select id into v_existing_id
  from public.site_news_comment_likes
  where comment_id = p_comment_id and user_id = v_user_id;

  if v_existing_id is not null then
    delete from public.site_news_comment_likes where id = v_existing_id;
    v_liked := false;
  else
    insert into public.site_news_comment_likes (comment_id, user_id)
    values (p_comment_id, v_user_id);
    v_liked := true;
  end if;

  select count(*)::integer into v_like_count
  from public.site_news_comment_likes where comment_id = p_comment_id;

  return jsonb_build_object('liked', v_liked, 'likeCount', v_like_count);
end;
$$;

create or replace function public.toggle_comment_favorite(p_comment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_author_id uuid;
  v_existing_id uuid;
  v_favorited boolean;
  v_favorite_count integer;
begin
  if v_user_id is null then
    raise exception 'login-required';
  end if;

  select user_id into v_author_id
  from public.site_news_comments where id = p_comment_id;

  if v_author_id is null then
    raise exception 'comment-not-found';
  end if;

  if v_author_id = v_user_id then
    raise exception 'self-interaction-blocked';
  end if;

  select id into v_existing_id
  from public.site_news_comment_favorites
  where comment_id = p_comment_id and user_id = v_user_id;

  if v_existing_id is not null then
    delete from public.site_news_comment_favorites where id = v_existing_id;
    v_favorited := false;
  else
    insert into public.site_news_comment_favorites (comment_id, user_id)
    values (p_comment_id, v_user_id);
    v_favorited := true;
  end if;

  select count(*)::integer into v_favorite_count
  from public.site_news_comment_favorites where comment_id = p_comment_id;

  return jsonb_build_object('favorited', v_favorited, 'favoriteCount', v_favorite_count);
end;
$$;

grant execute on function public.toggle_comment_like(uuid) to authenticated;
grant execute on function public.toggle_comment_favorite(uuid) to authenticated;

-- =============================================================================
-- 6) Article read / reading saved / journal XP
-- =============================================================================
create table if not exists public.user_article_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  news_id uuid not null references public.site_news(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, news_id)
);

alter table public.user_article_reads enable row level security;

drop policy if exists "Users can read their article reads" on public.user_article_reads;
create policy "Users can read their article reads"
on public.user_article_reads for select using (auth.uid() = user_id);

drop policy if exists "Users can insert their article reads" on public.user_article_reads;
create policy "Users can insert their article reads"
on public.user_article_reads for insert with check (auth.uid() = user_id);

drop function if exists public.mark_article_read_complete(uuid);

create or replace function public.mark_article_read_complete(p_news_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean := false;
begin
  if v_user_id is null or p_news_id is null then
    raise exception 'login-required';
  end if;

  insert into public.user_article_reads (user_id, news_id)
  values (v_user_id, p_news_id)
  on conflict (user_id, news_id) do nothing
  returning true into v_inserted;

  return coalesce(v_inserted, false);
end;
$$;

grant execute on function public.mark_article_read_complete(uuid) to authenticated;

create or replace function public.on_user_article_read_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    perform public.award_xp(new.user_id, 'article_read_complete', 10, new.news_id);
  exception
    when others then
      null;
  end;
  return new;
end;
$$;

drop trigger if exists user_article_reads_award_xp on public.user_article_reads;
create trigger user_article_reads_award_xp
after insert on public.user_article_reads
for each row
execute procedure public.on_user_article_read_award_xp();

do $$
begin
  if to_regclass('public.tarot_readings') is not null then
    execute $fn$
      create or replace function public.on_tarot_reading_saved_award_xp()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $body$
      begin
        begin
          perform public.award_xp(new.user_id, 'reading_saved', 8, new.id);
        exception
          when others then
            null;
        end;
        return new;
      end;
      $body$;
    $fn$;

    execute 'drop trigger if exists tarot_readings_award_xp on public.tarot_readings';
    execute $trg$
      create trigger tarot_readings_award_xp
      after insert on public.tarot_readings
      for each row
      execute procedure public.on_tarot_reading_saved_award_xp()
    $trg$;
  end if;

  if to_regclass('public.tarot_journal_entries') is not null then
    execute $fn$
      create or replace function public.on_journal_entry_award_xp()
      returns trigger
      language plpgsql
      security definer
      set search_path = public
      as $body$
      begin
        begin
          perform public.award_xp(new.user_id, 'journal_entry', 12, new.id);
        exception
          when others then
            null;
        end;
        return new;
      end;
      $body$;
    $fn$;

    execute 'drop trigger if exists tarot_journal_entries_award_xp on public.tarot_journal_entries';
    execute $trg$
      create trigger tarot_journal_entries_award_xp
      after insert on public.tarot_journal_entries
      for each row
      execute procedure public.on_journal_entry_award_xp()
    $trg$;
  end if;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.site_news_comments;
exception
  when duplicate_object then null;
  when undefined_object then null;
  when others then null;
end $$;

notify pgrst, 'reload schema';

select
  to_regclass('public.site_news_comments') as comments,
  to_regclass('public.user_profiles') as profiles,
  to_regclass('public.user_xp_events') as xp_events;
