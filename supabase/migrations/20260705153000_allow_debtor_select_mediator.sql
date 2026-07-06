drop policy if exists "cases_update_owner_draft_or_admin" on public.cases;

create policy "cases_update_owner_draft_or_admin"
on public.cases for update
to authenticated
using (
  public.is_admin()
  or assigned_mediator_id = auth.uid()
  or public.is_creditor_org_officer(creditor_organization_id)
  or (
    debtor_user_id = auth.uid()
    and status in (
      'draft',
      'needs_more_info',
      'creditor_accepted',
      'mediator_matching',
      'matched',
      'mediator_selected'
    )
  )
)
with check (
  public.is_admin()
  or assigned_mediator_id = auth.uid()
  or public.is_creditor_org_officer(creditor_organization_id)
  or debtor_user_id = auth.uid()
);
