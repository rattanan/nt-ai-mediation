drop policy if exists "consent_versions_select_active" on public.consent_versions;

create policy "consent_versions_select_active_public"
on public.consent_versions
for select
to anon, authenticated
using (is_active = true);

create policy "consent_versions_select_admin"
on public.consent_versions
for select
to authenticated
using (public.is_admin());
