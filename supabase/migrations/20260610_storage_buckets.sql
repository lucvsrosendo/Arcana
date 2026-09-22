-- Storage buckets for news images and Rider-Waite card artwork (public domain)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'card-images',
    'card-images',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  ),
  (
    'news-images',
    'news-images',
    true,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  )
on conflict (id) do nothing;

create policy "Public read card images"
  on storage.objects for select
  using (bucket_id = 'card-images');

create policy "Authenticated upload card images"
  on storage.objects for insert
  with check (
    bucket_id = 'card-images'
    and auth.role() = 'authenticated'
    and (
      exists (select 1 from public.site_news_admins a where a.user_id = auth.uid())
      or exists (select 1 from public.site_news_moderators m where m.user_id = auth.uid())
    )
  );

create policy "Public read news images"
  on storage.objects for select
  using (bucket_id = 'news-images');

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
