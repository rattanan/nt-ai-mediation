alter table public.mediator_profiles enable row level security;

drop policy if exists "mediator_profiles_select_scoped" on public.mediator_profiles;
create policy "mediator_profiles_select_scoped"
on public.mediator_profiles for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or status = 'approved'
);

drop policy if exists "mediator_profiles_insert_own" on public.mediator_profiles;
create policy "mediator_profiles_insert_own"
on public.mediator_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "mediator_profiles_update_own_or_admin" on public.mediator_profiles;
create policy "mediator_profiles_update_own_or_admin"
on public.mediator_profiles for update
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
)
with check (
  public.is_admin()
  or (user_id = auth.uid() and status in ('draft', 'submitted', 'needs_revision'))
);
