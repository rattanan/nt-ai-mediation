-- PostgREST INSERT ... RETURNING (used by .insert().select()) also requires
-- the inserted row to pass a SELECT policy. Allow only the mediator who owns
-- the closing record linked to the invoice to read it.
drop policy if exists "invoices_select_creditor_admin" on public.billing_invoices;
create policy "invoices_select_creditor_admin_mediator"
on public.billing_invoices
for select
to authenticated
using (
  public.is_admin()
  or public.is_creditor_org_officer(creditor_organization_id)
  or exists (
    select 1
    from public.mediation_closing_records r
    join public.mediator_profiles mp on mp.id = r.mediator_id
    where r.id = billing_invoices.closing_record_id
      and mp.user_id = (select auth.uid())
  )
);
