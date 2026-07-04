drop policy if exists "cases_insert_owner" on public.cases;
create policy "cases_insert_owner"
on public.cases for insert
to authenticated
with check (debtor_user_id = (select auth.uid()));

drop policy if exists "case_status_history_select_participants" on public.case_status_history;
create policy "case_status_history_select_participants"
on public.case_status_history for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.cases c
    where c.id = case_status_history.case_id
      and (
        c.debtor_user_id = (select auth.uid())
        or c.assigned_mediator_id = (select auth.uid())
        or public.is_creditor_org_officer(c.creditor_organization_id)
      )
  )
);

drop policy if exists "case_status_history_insert_participants" on public.case_status_history;
create policy "case_status_history_insert_participants"
on public.case_status_history for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.cases c
    where c.id = case_status_history.case_id
      and (
        c.debtor_user_id = (select auth.uid())
        or c.assigned_mediator_id = (select auth.uid())
        or public.is_creditor_org_officer(c.creditor_organization_id)
      )
  )
);
