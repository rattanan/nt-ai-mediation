insert into storage.buckets (id, name, public)
values ('case-documents', 'case-documents', false)
on conflict (id) do nothing;

drop policy if exists "case_documents_storage_insert_own_folder" on storage.objects;
create policy "case_documents_storage_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'case-documents'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "case_documents_storage_select_own_folder" on storage.objects;
create policy "case_documents_storage_select_own_folder"
on storage.objects for select
to authenticated
using (
  bucket_id = 'case-documents'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or public.is_admin()
  )
);
