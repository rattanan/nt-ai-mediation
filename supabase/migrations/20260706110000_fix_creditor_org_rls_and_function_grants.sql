alter table public.creditor_organizations enable row level security;
alter table public.creditor_officers enable row level security;

drop policy if exists "creditor_org_public_approved" on public.creditor_organizations;
create policy "creditor_org_public_approved"
on public.creditor_organizations for select
to anon, authenticated
using (status = 'approved' and is_public = true);

drop policy if exists "creditor_org_select_admin_or_officer" on public.creditor_organizations;
create policy "creditor_org_select_admin_or_officer"
on public.creditor_organizations for select
to authenticated
using (public.is_admin() or public.is_creditor_org_officer(id));

drop policy if exists "creditor_org_insert_creditor" on public.creditor_organizations;
create policy "creditor_org_insert_creditor"
on public.creditor_organizations for insert
to authenticated
with check (public.current_app_role() in ('creditor', 'admin'));

drop policy if exists "creditor_org_update_admin_or_org_admin" on public.creditor_organizations;
create policy "creditor_org_update_admin_or_org_admin"
on public.creditor_organizations for update
to authenticated
using (public.is_admin() or public.is_creditor_org_admin(id))
with check (public.is_admin() or public.is_creditor_org_admin(id));

drop policy if exists "creditor_officers_select_admin_or_same_org" on public.creditor_officers;
create policy "creditor_officers_select_admin_or_same_org"
on public.creditor_officers for select
to authenticated
using (
  public.is_admin()
  or user_id = (select auth.uid())
  or public.is_creditor_org_officer(organization_id)
);

drop policy if exists "creditor_officers_insert_admin_or_org_admin" on public.creditor_officers;
create policy "creditor_officers_insert_admin_or_org_admin"
on public.creditor_officers for insert
to authenticated
with check (
  public.is_admin()
  or user_id = (select auth.uid())
  or public.is_creditor_org_admin(organization_id)
);

drop policy if exists "creditor_officers_update_admin_or_org_admin" on public.creditor_officers;
create policy "creditor_officers_update_admin_or_org_admin"
on public.creditor_officers for update
to authenticated
using (public.is_admin() or public.is_creditor_org_admin(organization_id))
with check (public.is_admin() or public.is_creditor_org_admin(organization_id));

revoke execute on function public.current_app_role() from public, anon;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_creditor_org_admin(uuid) from public, anon;
revoke execute on function public.is_creditor_org_officer(uuid) from public, anon;

grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_creditor_org_admin(uuid) to authenticated;
grant execute on function public.is_creditor_org_officer(uuid) to authenticated;

alter function public.set_updated_at() set search_path = public;
