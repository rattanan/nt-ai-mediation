create table if not exists public.settlement_document_signatures (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.settlement_documents(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  signer_role text not null check (signer_role in ('debtor', 'creditor', 'mediator')),
  signer_user_id uuid not null references public.profiles(id) on delete cascade,
  signer_name text not null,
  signed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (document_id, signer_role)
);

create index if not exists settlement_document_signatures_document_idx
on public.settlement_document_signatures(document_id);

create index if not exists settlement_document_signatures_case_idx
on public.settlement_document_signatures(case_id);

alter table public.settlement_document_signatures enable row level security;

drop policy if exists "signatures_select_parties" on public.settlement_document_signatures;
create policy "signatures_select_parties"
on public.settlement_document_signatures for select
to authenticated
using (
  public.is_admin()
  or signer_user_id = (select auth.uid())
  or exists (
    select 1
    from public.settlement_documents d
    join public.mediation_closing_records r on r.id = d.closing_record_id
    where d.id = settlement_document_signatures.document_id
      and (
        r.debtor_user_id = (select auth.uid())
        or public.is_creditor_org_officer(r.creditor_organization_id)
        or exists (
          select 1
          from public.mediator_profiles mp
          where mp.id = r.mediator_id
            and mp.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "signatures_insert_parties" on public.settlement_document_signatures;
create policy "signatures_insert_parties"
on public.settlement_document_signatures for insert
to authenticated
with check (
  signer_user_id = (select auth.uid())
  and exists (
    select 1
    from public.settlement_documents d
    join public.mediation_closing_records r on r.id = d.closing_record_id
    where d.id = document_id
      and (
        public.is_admin()
        or r.debtor_user_id = (select auth.uid())
        or public.is_creditor_org_officer(r.creditor_organization_id)
        or exists (
          select 1
          from public.mediator_profiles mp
          where mp.id = r.mediator_id
            and mp.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "signatures_update_admin" on public.settlement_document_signatures;
create policy "signatures_update_admin"
on public.settlement_document_signatures for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "signatures_delete_admin" on public.settlement_document_signatures;
create policy "signatures_delete_admin"
on public.settlement_document_signatures for delete
to authenticated
using (public.is_admin());
