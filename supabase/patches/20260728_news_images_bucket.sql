-- Ensure news cover storage + DB column + Storage RLS (idempotent).
-- Run in Supabase SQL Editor if cover upload fails with:
--   - Bucket not found
--   - cover-column-missing
--   - new row violates row-level security policy

alter table public.site_news
  add column if not exists cover_image_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images',
  'news-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Editor check used by storage policies (SECURITY DEFINER so RLS on
-- site_news_admins/moderators does not block the EXISTS from storage.objects).
create or replace function public.is_news_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.uid() is not null
    and (
      exists (
        select 1
        from public.site_news_admins a
        where a.user_id = auth.uid()
      )
      or exists (
        select 1
        from public.site_news_moderators m
        where m.user_id = auth.uid()
      )
    );
$$;

revoke all on function public.is_news_editor() from public;
grant execute on function public.is_news_editor() to authenticated;

drop policy if exists "Public read news images" on storage.objects;
create policy "Public read news images"
  on storage.objects
  for select
  using (bucket_id = 'news-images');

drop policy if exists "News editors upload images" on storage.objects;
create policy "News editors upload images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'news-images'
    and public.is_news_editor()
  );

drop policy if exists "News editors update images" on storage.objects;
create policy "News editors update images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'news-images'
    and public.is_news_editor()
  )
  with check (
    bucket_id = 'news-images'
    and public.is_news_editor()
  );

drop policy if exists "News editors delete images" on storage.objects;
create policy "News editors delete images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'news-images'
    and public.is_news_editor()
  );
