-- Restrict card/news image writes to editors/admins (idempotent companion to 20260728 patch).

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
