-- Stop awarding XP for saving readings (auto-save to history only).
-- Idempotent: safe to re-run.

drop trigger if exists tarot_readings_award_xp on public.tarot_readings;

drop function if exists public.on_tarot_reading_saved_award_xp();

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

revoke all on function public.award_xp(uuid, text, integer, uuid) from public, anon, authenticated;
