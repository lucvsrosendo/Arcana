-- Journal XP: triggers + claim RPC (idempotent). Paste in Supabase SQL Editor and Run.

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

create unique index if not exists user_xp_events_user_event_source_uidx
on public.user_xp_events (user_id, event_type, source_id);

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
end;
$$;

create or replace function public.on_journal_entry_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_xp(new.user_id, 'journal_entry', 12, new.id);
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists tarot_journal_entries_award_xp on public.tarot_journal_entries;
create trigger tarot_journal_entries_award_xp
after insert on public.tarot_journal_entries
for each row
execute function public.on_journal_entry_award_xp();

create or replace function public.on_tarot_reading_saved_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_xp(new.user_id, 'reading_saved', 8, new.id);
  return new;
exception
  when others then
    return new;
end;
$$;

drop trigger if exists tarot_readings_award_xp on public.tarot_readings;
create trigger tarot_readings_award_xp
after insert on public.tarot_readings
for each row
execute function public.on_tarot_reading_saved_award_xp();

-- Client-callable claim (also backfills entries saved before the trigger existed).
create or replace function public.claim_journal_entry_xp(p_entry_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted_id uuid;
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

  perform public.ensure_user_profile_row(v_user_id);

  insert into public.user_xp_events (user_id, event_type, points, source_id)
  values (v_user_id, 'journal_entry', 12, p_entry_id)
  on conflict (user_id, event_type, source_id) do nothing
  returning id into v_inserted_id;

  if v_inserted_id is null then
    return 0;
  end if;

  update public.user_profiles
  set xp_total = coalesce(xp_total, 0) + 12
  where user_id = v_user_id;

  return 12;
end;
$$;

grant execute on function public.claim_journal_entry_xp(uuid) to authenticated;

notify pgrst, 'reload schema';
