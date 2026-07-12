drop policy if exists "cases_mediator_reject_own_assignment" on public.cases;
create policy "cases_mediator_reject_own_assignment"
on public.cases for update
to authenticated
using (
  status = 'mediator_selected'
  and assigned_mediator_id = (select auth.uid())
  and exists (
    select 1
    from public.mediator_profiles mp
    where mp.id = selected_mediator_profile_id
      and mp.user_id = (select auth.uid())
      and mp.status = 'approved'
  )
)
with check (
  status = 'mediator_matching'
  and assigned_mediator_id is null
  and selected_mediator_profile_id is null
);
