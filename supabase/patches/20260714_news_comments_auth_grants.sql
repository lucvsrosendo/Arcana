-- Ensure any authenticated user can comment on news (not only admins).
-- Safe to run multiple times.

grant select, insert, update, delete on public.site_news_comments to authenticated;
grant select on public.site_news_comments to anon;

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
