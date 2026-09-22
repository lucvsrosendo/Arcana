-- XP security hardening + schema hygiene (idempotent).
-- Aligns with src/data/xpRules.ts and plan xp_supabase_audit_fix.
-- Paste in Supabase SQL Editor or apply via CLI.

-- =============================================================================
-- 1) Lock xp_total against client writes (allow only via app.allow_xp_mutation)
-- =============================================================================
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

-- =============================================================================
-- 2) Hardened award_xp / revoke_xp (allowlist + mutation flag + warnings)
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

-- =============================================================================
-- 3) Comment XP revoke on delete + claim_journal_entry_xp (canonical)
-- =============================================================================
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

-- =============================================================================
-- 4) Narrow comment mutable fields
-- =============================================================================
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

-- =============================================================================
-- 5) Journal linked_reading FK + indexes
-- =============================================================================
do $$
begin
  alter table public.tarot_journal_entries
    add constraint tarot_journal_entries_linked_reading_id_fkey
    foreign key (linked_reading_id)
    references public.tarot_readings(id)
    on delete set null;
exception
  when duplicate_object then null;
  when others then
    raise warning 'linked_reading FK skipped: %', sqlerrm;
end $$;

create index if not exists user_profiles_xp_total_desc_idx
on public.user_profiles (xp_total desc);

create index if not exists site_news_comments_user_created_at_idx
on public.site_news_comments (user_id, created_at desc);

-- =============================================================================
-- 6) Complete account wipe
-- =============================================================================
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
  delete from public.comment_reports where reporter_id = v_user_id;
  delete from public.site_news_comments where user_id = v_user_id;
  delete from public.user_article_reads where user_id = v_user_id;
  delete from public.user_xp_events where user_id = v_user_id;
  delete from public.tarot_journal_entries where user_id = v_user_id;
  delete from public.tarot_readings where user_id = v_user_id;
  delete from public.user_streaks where user_id = v_user_id;
  delete from public.user_profiles where user_id = v_user_id;
exception
  when undefined_table then
    -- older projects may lack optional tables; continue best-effort
    null;
end;
$$;

-- Prefer explicit deletes without swallowing (redefine without broad exception if tables exist)
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

-- =============================================================================
-- 7) Storage: editors/admins only for news/card image writes
-- =============================================================================
drop policy if exists "Authenticated upload card images" on storage.objects;
drop policy if exists "Editors upload card images" on storage.objects;
create policy "Editors upload card images"
  on storage.objects for insert
  with check (
    bucket_id = 'card-images'
    and auth.role() = 'authenticated'
    and (
      exists (select 1 from public.site_news_admins a where a.user_id = auth.uid())
      or exists (select 1 from public.site_news_moderators m where m.user_id = auth.uid())
    )
  );

drop policy if exists "News editors upload images" on storage.objects;
create policy "News editors upload images"
  on storage.objects for insert
  with check (
    bucket_id = 'news-images'
    and auth.role() = 'authenticated'
    and (
      exists (select 1 from public.site_news_admins a where a.user_id = auth.uid())
      or exists (select 1 from public.site_news_moderators m where m.user_id = auth.uid())
    )
  );

drop policy if exists "News editors update images" on storage.objects;
create policy "News editors update images"
  on storage.objects for update
  using (
    bucket_id = 'news-images'
    and auth.role() = 'authenticated'
    and (
      exists (select 1 from public.site_news_admins a where a.user_id = auth.uid())
      or exists (select 1 from public.site_news_moderators m where m.user_id = auth.uid())
    )
  );

drop policy if exists "News editors delete images" on storage.objects;
create policy "News editors delete images"
  on storage.objects for delete
  using (
    bucket_id = 'news-images'
    and auth.role() = 'authenticated'
    and (
      exists (select 1 from public.site_news_admins a where a.user_id = auth.uid())
      or exists (select 1 from public.site_news_moderators m where m.user_id = auth.uid())
    )
  );

notify pgrst, 'reload schema';
