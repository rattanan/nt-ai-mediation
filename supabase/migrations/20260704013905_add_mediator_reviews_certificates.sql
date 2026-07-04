create table if not exists public.mediator_reviews (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  mediator_id uuid not null references public.mediator_profiles(id) on delete cascade,
  debtor_user_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid null references public.profiles(id) on delete set null,
  reviewed_at timestamptz null,
  admin_note text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists mediator_reviews_mediator_status_idx
on public.mediator_reviews(mediator_id, status, submitted_at desc);

create index if not exists mediator_reviews_status_idx
on public.mediator_reviews(status, submitted_at desc);

create table if not exists public.case_completion_certificates (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  closing_record_id uuid not null references public.mediation_closing_records(id) on delete cascade,
  certificate_number text not null unique,
  issued_to_user_id uuid not null references public.profiles(id) on delete cascade,
  mediator_id uuid not null references public.mediator_profiles(id) on delete cascade,
  issued_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists case_completion_certificates_case_idx
on public.case_completion_certificates(case_id);

alter table public.mediator_reviews enable row level security;
alter table public.case_completion_certificates enable row level security;

drop policy if exists "mediator_reviews_select_participants" on public.mediator_reviews;
create policy "mediator_reviews_select_participants"
on public.mediator_reviews for select
to authenticated
using (
  public.is_admin()
  or debtor_user_id = (select auth.uid())
  or exists (
    select 1
    from public.mediator_profiles mp
    where mp.id = mediator_reviews.mediator_id
      and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "mediator_reviews_select_public_approved" on public.mediator_reviews;
create policy "mediator_reviews_select_public_approved"
on public.mediator_reviews for select
to anon, authenticated
using (status = 'approved');

drop policy if exists "mediator_reviews_insert_debtor_completed_case" on public.mediator_reviews;
create policy "mediator_reviews_insert_debtor_completed_case"
on public.mediator_reviews for insert
to authenticated
with check (
  debtor_user_id = (select auth.uid())
  and status = 'pending'
  and exists (
    select 1
    from public.cases c
    where c.id = mediator_reviews.case_id
      and c.debtor_user_id = (select auth.uid())
      and c.status in ('settled', 'closed')
      and c.selected_mediator_profile_id = mediator_reviews.mediator_id
  )
);

drop policy if exists "mediator_reviews_update_admin" on public.mediator_reviews;
create policy "mediator_reviews_update_admin"
on public.mediator_reviews for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "mediator_reviews_delete_admin" on public.mediator_reviews;
create policy "mediator_reviews_delete_admin"
on public.mediator_reviews for delete
to authenticated
using (public.is_admin());

drop policy if exists "completion_certificates_select_participants" on public.case_completion_certificates;
create policy "completion_certificates_select_participants"
on public.case_completion_certificates for select
to authenticated
using (
  public.is_admin()
  or issued_to_user_id = (select auth.uid())
  or exists (
    select 1
    from public.mediator_profiles mp
    where mp.id = case_completion_certificates.mediator_id
      and mp.user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.cases c
    where c.id = case_completion_certificates.case_id
      and public.is_creditor_org_officer(c.creditor_organization_id)
  )
);

drop policy if exists "completion_certificates_manage_admin" on public.case_completion_certificates;
create policy "completion_certificates_manage_admin"
on public.case_completion_certificates for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
