insert into storage.buckets (id, name, public)
values ('mediator-profile-images', 'mediator-profile-images', true)
on conflict (id) do nothing;

drop policy if exists "mediator_profile_images_select_public" on storage.objects;
create policy "mediator_profile_images_select_public"
on storage.objects for select
to public
using (bucket_id = 'mediator-profile-images');

drop policy if exists "mediator_profile_images_insert_own_folder" on storage.objects;
create policy "mediator_profile_images_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'mediator-profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "mediator_profile_images_update_own_folder" on storage.objects;
create policy "mediator_profile_images_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'mediator-profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'mediator-profile-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
