create extension if not exists "pgcrypto";

create table if not exists public.tarot_readings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  spread_id text not null,
  spread_title text not null,
  created_at timestamptz not null default now(),
  question text null,
  cards jsonb not null default '[]'::jsonb,
  combinations jsonb not null default '[]'::jsonb
);

alter table public.tarot_readings
add column if not exists question text null;

do $$
begin
  alter table public.tarot_readings
    add constraint tarot_readings_cards_is_array
    check (jsonb_typeof(cards) = 'array');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.tarot_readings
    add constraint tarot_readings_combinations_is_array
    check (jsonb_typeof(combinations) = 'array');
exception
  when duplicate_object then null;
end $$;

create index if not exists tarot_readings_user_created_at_idx
on public.tarot_readings (user_id, created_at desc);

alter table public.tarot_readings enable row level security;

drop policy if exists "Users can read their tarot readings"
on public.tarot_readings;

create policy "Users can read their tarot readings"
on public.tarot_readings for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their tarot readings"
on public.tarot_readings;

create policy "Users can insert their tarot readings"
on public.tarot_readings for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their tarot readings"
on public.tarot_readings;

create policy "Users can update their tarot readings"
on public.tarot_readings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their tarot readings"
on public.tarot_readings;

create policy "Users can delete their tarot readings"
on public.tarot_readings for delete
using (auth.uid() = user_id);

create table if not exists public.tarot_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  manifestation text null,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  linked_reading_id uuid null
);

alter table public.tarot_journal_entries
add column if not exists manifestation text null;

alter table public.tarot_journal_entries
add column if not exists tags jsonb not null default '[]'::jsonb;

do $$
begin
  alter table public.tarot_journal_entries
    add constraint tarot_journal_entries_title_not_blank
    check (length(trim(title)) > 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.tarot_journal_entries
    add constraint tarot_journal_entries_content_not_blank
    check (length(trim(content)) > 0);
exception
  when duplicate_object then null;
end $$;

create index if not exists tarot_journal_entries_user_created_at_idx
on public.tarot_journal_entries (user_id, created_at desc);

do $$
begin
  alter table public.tarot_journal_entries
    add constraint tarot_journal_entries_linked_reading_id_fkey
    foreign key (linked_reading_id)
    references public.tarot_readings(id)
    on delete set null;
exception
  when duplicate_object then null;
  when others then null;
end $$;

alter table public.tarot_journal_entries enable row level security;

drop policy if exists "Users can read their journal entries"
on public.tarot_journal_entries;

create policy "Users can read their journal entries"
on public.tarot_journal_entries for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their journal entries"
on public.tarot_journal_entries;

create policy "Users can insert their journal entries"
on public.tarot_journal_entries for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their journal entries"
on public.tarot_journal_entries;

create policy "Users can update their journal entries"
on public.tarot_journal_entries for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their journal entries"
on public.tarot_journal_entries;

create policy "Users can delete their journal entries"
on public.tarot_journal_entries for delete
using (auth.uid() = user_id);

create table if not exists public.site_news_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_news_admins enable row level security;

drop policy if exists "Admins can read admin list"
on public.site_news_admins;

create policy "Admins can read admin list"
on public.site_news_admins for select
using (auth.uid() = user_id);

create table if not exists public.site_news_moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.site_news_moderators enable row level security;

drop policy if exists "Moderators can read own moderator row"
on public.site_news_moderators;

create policy "Moderators can read own moderator row"
on public.site_news_moderators for select
using (auth.uid() = user_id);

drop policy if exists "Admins can manage moderator list"
on public.site_news_moderators;

create policy "Admins can manage moderator list"
on public.site_news_moderators for all
using (
  exists (
    select 1
    from public.site_news_admins admins
    where admins.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.site_news_admins admins
    where admins.user_id = auth.uid()
  )
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
  cover_image_url text,
  created_at timestamptz not null default now()
);

alter table public.site_news
  add column if not exists cover_image_url text;

do $$
begin
  alter table public.site_news
    add constraint site_news_title_pt_not_blank
    check (length(trim(title_pt)) > 0);
exception
  when duplicate_object then null;
end $$;

do $$
begin
  alter table public.site_news
    add constraint site_news_summary_pt_not_blank
    check (length(trim(summary_pt)) > 0);
exception
  when duplicate_object then null;
end $$;

create index if not exists site_news_created_at_idx
on public.site_news (created_at desc);

alter table public.site_news enable row level security;

drop policy if exists "Public can read site news"
on public.site_news;

create policy "Public can read site news"
on public.site_news for select
using (true);

drop policy if exists "Admins can insert site news"
on public.site_news;

drop policy if exists "Editors can insert site news"
on public.site_news;

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

drop policy if exists "Admins can update site news"
on public.site_news;

drop policy if exists "Editors can update site news"
on public.site_news;

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

drop policy if exists "Admins can delete site news"
on public.site_news;

drop policy if exists "Editors can delete site news"
on public.site_news;

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

create table if not exists public.site_news_comments (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references public.site_news(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_display_name text not null default '',
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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
execute function public.set_site_news_comments_updated_at();

alter table public.site_news_comments enable row level security;

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

-- ============================================================
-- USER PROFILES, XP, COMMENT INTERACTIONS
-- ============================================================

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
execute function public.set_user_profiles_updated_at();

alter table public.user_profiles enable row level security;

drop policy if exists "Public can read user profiles" on public.user_profiles;
create policy "Public can read user profiles"
on public.user_profiles for select
using (true);

drop policy if exists "Users can insert their profile" on public.user_profiles;
create policy "Users can insert their profile"
on public.user_profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their profile" on public.user_profiles;
create policy "Users can update their profile"
on public.user_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

alter table public.user_xp_events enable row level security;

drop policy if exists "Users can read their xp events" on public.user_xp_events;
create policy "Users can read their xp events"
on public.user_xp_events for select
using (auth.uid() = user_id);

create table if not exists public.site_news_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.site_news_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists site_news_comment_likes_comment_idx
on public.site_news_comment_likes (comment_id);

alter table public.site_news_comment_likes enable row level security;

drop policy if exists "Public can read comment likes" on public.site_news_comment_likes;
create policy "Public can read comment likes"
on public.site_news_comment_likes for select
using (true);

create table if not exists public.site_news_comment_favorites (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.site_news_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (comment_id, user_id)
);

create index if not exists site_news_comment_favorites_comment_idx
on public.site_news_comment_favorites (comment_id);

alter table public.site_news_comment_favorites enable row level security;

drop policy if exists "Public can read comment favorites" on public.site_news_comment_favorites;
create policy "Public can read comment favorites"
on public.site_news_comment_favorites for select
using (true);

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
  v_expected integer;
begin
  if p_user_id is null or p_points <= 0 or p_source_id is null or p_event_type is null then
    return;
  end if;

  v_expected := case p_event_type
    when 'comment_created' then 15
    when 'like_given' then 3
    when 'like_received' then 6
    when 'favorite_given' then 4
    when 'favorite_received' then 12
    when 'article_read_complete' then 10
    when 'journal_entry' then 12
    else null
  end;

  if v_expected is null or p_points <> v_expected then
    raise warning 'award_xp rejected: invalid event/points % / %', p_event_type, p_points;
    return;
  end if;

  perform public.ensure_user_profile_row(p_user_id);
  perform set_config('app.allow_xp_mutation', 'on', true);

  insert into public.user_xp_events (user_id, event_type, points, source_id)
  values (p_user_id, p_event_type, p_points, p_source_id)
  on conflict (user_id, event_type, source_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is not null then
    update public.user_profiles
    set xp_total = xp_total + p_points
    where user_id = p_user_id;
  end if;
exception
  when others then
    raise warning 'award_xp failed: %', sqlerrm;
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
    and source_id = p_source_id
  for update;

  if v_points is null then
    return;
  end if;

  delete from public.user_xp_events
  where user_id = p_user_id
    and event_type = p_event_type
    and source_id = p_source_id;

  perform set_config('app.allow_xp_mutation', 'on', true);

  update public.user_profiles
  set xp_total = greatest(0, xp_total - v_points)
  where user_id = p_user_id;
exception
  when others then
    raise warning 'revoke_xp failed: %', sqlerrm;
end;
$$;

revoke all on function public.ensure_user_profile_row(uuid) from public, anon, authenticated;
revoke all on function public.award_xp(uuid, text, integer, uuid) from public, anon, authenticated;
revoke all on function public.revoke_xp(uuid, text, uuid) from public, anon, authenticated;

create or replace function public.lock_user_profiles_xp_total()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'UPDATE'
     and new.xp_total is distinct from old.xp_total
     and coalesce(current_setting('app.allow_xp_mutation', true), '') <> 'on'
  then
    new.xp_total := old.xp_total;
  end if;
  return new;
end;
$$;

drop trigger if exists user_profiles_lock_xp_total on public.user_profiles;
create trigger user_profiles_lock_xp_total
before update on public.user_profiles
for each row
execute function public.lock_user_profiles_xp_total();

create or replace function public.on_comment_like_xp_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  if tg_op = 'INSERT' then
    select user_id
    into v_author_id
    from public.site_news_comments
    where id = new.comment_id;

    if v_author_id is null or v_author_id = new.user_id then
      return new;
    end if;

    perform public.award_xp(new.user_id, 'like_given', 3, new.id);
    perform public.award_xp(v_author_id, 'like_received', 6, new.id);
    return new;
  end if;

  select user_id
  into v_author_id
  from public.site_news_comments
  where id = old.comment_id;

  perform public.revoke_xp(old.user_id, 'like_given', old.id);

  if v_author_id is not null and v_author_id <> old.user_id then
    perform public.revoke_xp(v_author_id, 'like_received', old.id);
  end if;

  return old;
end;
$$;

drop trigger if exists site_news_comment_likes_xp_change on public.site_news_comment_likes;
create trigger site_news_comment_likes_xp_change
after insert or delete on public.site_news_comment_likes
for each row
execute function public.on_comment_like_xp_change();

create or replace function public.on_comment_favorite_xp_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_author_id uuid;
begin
  if tg_op = 'INSERT' then
    select user_id
    into v_author_id
    from public.site_news_comments
    where id = new.comment_id;

    if v_author_id is null or v_author_id = new.user_id then
      return new;
    end if;

    perform public.award_xp(new.user_id, 'favorite_given', 4, new.id);
    perform public.award_xp(v_author_id, 'favorite_received', 12, new.id);
    return new;
  end if;

  select user_id
  into v_author_id
  from public.site_news_comments
  where id = old.comment_id;

  perform public.revoke_xp(old.user_id, 'favorite_given', old.id);

  if v_author_id is not null and v_author_id <> old.user_id then
    perform public.revoke_xp(v_author_id, 'favorite_received', old.id);
  end if;

  return old;
end;
$$;

drop trigger if exists site_news_comment_favorites_xp_change on public.site_news_comment_favorites;
create trigger site_news_comment_favorites_xp_change
after insert or delete on public.site_news_comment_favorites
for each row
execute function public.on_comment_favorite_xp_change();

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
execute function public.on_site_news_comment_created_award_xp();

create or replace function public.on_site_news_comment_deleted_revoke_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.revoke_xp(old.user_id, 'comment_created', old.id);
  return old;
exception
  when others then
    raise warning 'comment delete revoke_xp failed: %', sqlerrm;
    return old;
end;
$$;

drop trigger if exists site_news_comments_revoke_xp on public.site_news_comments;
create trigger site_news_comments_revoke_xp
after delete on public.site_news_comments
for each row
execute function public.on_site_news_comment_deleted_revoke_xp();

create or replace function public.guard_site_news_comments_update()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.news_id is distinct from old.news_id
     or new.parent_id is distinct from old.parent_id
     or new.author_display_name is distinct from old.author_display_name
     or new.created_at is distinct from old.created_at
     or new.id is distinct from old.id
  then
    raise exception 'comment-immutable-fields';
  end if;
  return new;
end;
$$;

drop trigger if exists site_news_comments_guard_update on public.site_news_comments;
create trigger site_news_comments_guard_update
before update on public.site_news_comments
for each row
execute function public.guard_site_news_comments_update();

create or replace function public.claim_journal_entry_xp(p_entry_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_before integer;
  v_after integer;
begin
  if v_user_id is null then
    raise exception 'login-required';
  end if;

  if p_entry_id is null then
    return 0;
  end if;

  if not exists (
    select 1
    from public.tarot_journal_entries
    where id = p_entry_id
      and user_id = v_user_id
  ) then
    return 0;
  end if;

  select xp_total into v_before
  from public.user_profiles
  where user_id = v_user_id;

  perform public.award_xp(v_user_id, 'journal_entry', 12, p_entry_id);

  select xp_total into v_after
  from public.user_profiles
  where user_id = v_user_id;

  if coalesce(v_after, 0) > coalesce(v_before, 0) then
    return 12;
  end if;

  return 0;
end;
$$;

revoke all on function public.claim_journal_entry_xp(uuid) from public, anon;
grant execute on function public.claim_journal_entry_xp(uuid) to authenticated;

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

  select user_id
  into v_author_id
  from public.site_news_comments
  where id = p_comment_id;

  if v_author_id is null then
    raise exception 'comment-not-found';
  end if;

  if v_author_id = v_user_id then
    raise exception 'self-interaction-blocked';
  end if;

  select id
  into v_existing_id
  from public.site_news_comment_likes
  where comment_id = p_comment_id
    and user_id = v_user_id;

  if v_existing_id is not null then
    delete from public.site_news_comment_likes where id = v_existing_id;
    v_liked := false;
  else
    insert into public.site_news_comment_likes (comment_id, user_id)
    values (p_comment_id, v_user_id);
    v_liked := true;
  end if;

  select count(*)::integer
  into v_like_count
  from public.site_news_comment_likes
  where comment_id = p_comment_id;

  return jsonb_build_object(
    'liked', v_liked,
    'likeCount', v_like_count
  );
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

  select user_id
  into v_author_id
  from public.site_news_comments
  where id = p_comment_id;

  if v_author_id is null then
    raise exception 'comment-not-found';
  end if;

  if v_author_id = v_user_id then
    raise exception 'self-interaction-blocked';
  end if;

  select id
  into v_existing_id
  from public.site_news_comment_favorites
  where comment_id = p_comment_id
    and user_id = v_user_id;

  if v_existing_id is not null then
    delete from public.site_news_comment_favorites where id = v_existing_id;
    v_favorited := false;
  else
    insert into public.site_news_comment_favorites (comment_id, user_id)
    values (p_comment_id, v_user_id);
    v_favorited := true;
  end if;

  select count(*)::integer
  into v_favorite_count
  from public.site_news_comment_favorites
  where comment_id = p_comment_id;

  return jsonb_build_object(
    'favorited', v_favorited,
    'favoriteCount', v_favorite_count
  );
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

create or replace function public.delete_my_account_data()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'login-required';
  end if;

  delete from public.site_news_comment_likes where user_id = v_user_id;
  delete from public.site_news_comment_favorites where user_id = v_user_id;

  if to_regclass('public.comment_reports') is not null then
    execute 'delete from public.comment_reports where reporter_id = $1' using v_user_id;
  end if;

  delete from public.site_news_comments where user_id = v_user_id;

  if to_regclass('public.user_article_reads') is not null then
    execute 'delete from public.user_article_reads where user_id = $1' using v_user_id;
  end if;

  delete from public.user_xp_events where user_id = v_user_id;
  delete from public.tarot_journal_entries where user_id = v_user_id;
  delete from public.tarot_readings where user_id = v_user_id;

  if to_regclass('public.user_streaks') is not null then
    execute 'delete from public.user_streaks where user_id = $1' using v_user_id;
  end if;

  delete from public.user_profiles where user_id = v_user_id;
end;
$$;

grant execute on function public.toggle_comment_like(uuid) to authenticated;
grant execute on function public.toggle_comment_favorite(uuid) to authenticated;
grant execute on function public.ensure_user_profile() to authenticated;
grant execute on function public.delete_my_account_data() to authenticated;

create index if not exists user_profiles_xp_total_desc_idx
on public.user_profiles (xp_total desc);

create index if not exists site_news_comments_user_created_at_idx
on public.site_news_comments (user_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Avatar images are publicly accessible" on storage.objects;
create policy "Avatar images are publicly accessible"
on storage.objects for select
using (bucket_id = 'avatars');

drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
