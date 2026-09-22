create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  streak_count integer not null default 0 check (streak_count >= 0),
  last_visit_date date,
  leaderboard_opt_in boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.user_streaks enable row level security;

drop policy if exists "Users can read own streak" on public.user_streaks;
create policy "Users can read own streak"
on public.user_streaks for select
using (auth.uid() = user_id);

drop policy if exists "Public can read opted-in streaks" on public.user_streaks;
create policy "Public can read opted-in streaks"
on public.user_streaks for select
using (leaderboard_opt_in = true);

drop policy if exists "Users can upsert own streak" on public.user_streaks;
create policy "Users can upsert own streak"
on public.user_streaks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
