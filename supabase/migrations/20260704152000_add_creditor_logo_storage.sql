insert into storage.buckets (id, name, public)
values ('creditor-logos', 'creditor-logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "creditor_logos_select_public" on storage.objects;
create policy "creditor_logos_select_public"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'creditor-logos');

drop policy if exists "creditor_logos_insert_own_folder" on storage.objects;
create policy "creditor_logos_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'creditor-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "creditor_logos_update_own_folder" on storage.objects;
create policy "creditor_logos_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'creditor-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'creditor-logos'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
