-- XP expansion, comment threading, and moderation reports
-- Run after schema.sql

-- Optional long-form article body (markdown)
alter table public.site_news
  add column if not exists body_pt text not null default '',
  add column if not exists body_en text not null default '',
  add column if not exists body_es text not null default '';

-- Threaded replies
alter table public.site_news_comments
  add column if not exists parent_id uuid
  references public.site_news_comments(id) on delete cascade;

create index if not exists site_news_comments_parent_id_idx
on public.site_news_comments (parent_id);

create index if not exists site_news_comments_news_created_desc_idx
on public.site_news_comments (news_id, created_at desc);

-- Comment reports for moderation
create table if not exists public.comment_reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.site_news_comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create index if not exists comment_reports_comment_idx
on public.comment_reports (comment_id);

alter table public.comment_reports enable row level security;

drop policy if exists "Users can insert comment reports" on public.comment_reports;
create policy "Users can insert comment reports"
on public.comment_reports for insert
with check (auth.uid() = reporter_id);

drop policy if exists "Editors can read comment reports" on public.comment_reports;
create policy "Editors can read comment reports"
on public.comment_reports for select
using (
  exists (
    select 1 from public.site_news_admins admins where admins.user_id = auth.uid()
  )
  or exists (
    select 1 from public.site_news_moderators moderators where moderators.user_id = auth.uid()
  )
);

-- Article read completion (client calls RPC when scroll progress reaches 100%)
create table if not exists public.user_article_reads (
  user_id uuid not null references auth.users(id) on delete cascade,
  news_id uuid not null references public.site_news(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, news_id)
);

alter table public.user_article_reads enable row level security;

drop policy if exists "Users can read their article reads" on public.user_article_reads;
create policy "Users can read their article reads"
on public.user_article_reads for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their article reads" on public.user_article_reads;
create policy "Users can insert their article reads"
on public.user_article_reads for insert
with check (auth.uid() = user_id);

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
  perform public.award_xp(new.user_id, 'article_read_complete', 10, new.news_id);
  return new;
end;
$$;

drop trigger if exists user_article_reads_award_xp on public.user_article_reads;
create trigger user_article_reads_award_xp
after insert on public.user_article_reads
for each row
execute function public.on_user_article_read_award_xp();

-- XP: saving a tarot reading
create or replace function public.on_tarot_reading_saved_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_xp(new.user_id, 'reading_saved', 8, new.id);
  return new;
end;
$$;

drop trigger if exists tarot_readings_award_xp on public.tarot_readings;
create trigger tarot_readings_award_xp
after insert on public.tarot_readings
for each row
execute function public.on_tarot_reading_saved_award_xp();

-- XP: journal entry created
create or replace function public.on_journal_entry_award_xp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.award_xp(new.user_id, 'journal_entry', 12, new.id);
  return new;
end;
$$;

drop trigger if exists tarot_journal_entries_award_xp on public.tarot_journal_entries;
create trigger tarot_journal_entries_award_xp
after insert on public.tarot_journal_entries
for each row
execute function public.on_journal_entry_award_xp();

-- Enable realtime for comment sync
alter publication supabase_realtime add table public.site_news_comments;
