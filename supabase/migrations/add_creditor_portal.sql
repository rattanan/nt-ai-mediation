do $$
begin
  create type public.creditor_organization_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.creditor_officer_role as enum ('creditor_admin', 'creditor_staff', 'creditor_approver');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.creditor_response_status as enum (
    'accepted',
    'rejected',
    'needs_more_info',
    'settlement_proposed',
    'settlement_approved'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.creditor_organizations (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  organization_type text not null,
  logo text,
  tax_id text,
  contact_email text,
  contact_phone text,
  address text,
  status public.creditor_organization_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creditor_officers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  organization_id uuid not null references public.creditor_organizations(id) on delete cascade,
  profile_image text,
  first_name text not null,
  last_name text not null,
  mobile text,
  email text,
  position text,
  role public.creditor_officer_role not null default 'creditor_staff',
  status text not null default 'active' check (status in ('pending', 'active', 'suspended', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, organization_id)
);

alter table public.cases
add column if not exists creditor_organization_id uuid references public.creditor_organizations(id) on delete set null;

create table if not exists public.case_creditor_responses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  organization_id uuid not null references public.creditor_organizations(id) on delete cascade,
  officer_id uuid references public.creditor_officers(id) on delete set null,
  response public.creditor_response_status not null,
  reason text,
  requested_information text,
  proposed_terms text,
  settlement_amount numeric(14, 2),
  monthly_payment numeric(14, 2),
  created_at timestamptz not null default now()
);

create index if not exists creditor_organizations_status_idx on public.creditor_organizations(status);
create index if not exists creditor_officers_user_id_idx on public.creditor_officers(user_id);
create index if not exists creditor_officers_organization_id_idx on public.creditor_officers(organization_id);
create index if not exists cases_creditor_organization_id_idx on public.cases(creditor_organization_id);
create index if not exists case_creditor_responses_case_id_idx on public.case_creditor_responses(case_id);
create index if not exists case_creditor_responses_organization_id_idx on public.case_creditor_responses(organization_id);

drop trigger if exists set_creditor_organizations_updated_at on public.creditor_organizations;
create trigger set_creditor_organizations_updated_at
before update on public.creditor_organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_creditor_officers_updated_at on public.creditor_officers;
create trigger set_creditor_officers_updated_at
before update on public.creditor_officers
for each row execute function public.set_updated_at();

create or replace function public.is_creditor_org_officer(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.creditor_officers co
    where co.organization_id = org_id
      and co.user_id = auth.uid()
      and co.status = 'active'
  )
$$;

create or replace function public.is_creditor_org_admin(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.creditor_officers co
    where co.organization_id = org_id
      and co.user_id = auth.uid()
      and co.role = 'creditor_admin'
      and co.status = 'active'
  )
$$;

alter table public.creditor_organizations enable row level security;
alter table public.creditor_officers enable row level security;
alter table public.case_creditor_responses enable row level security;

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
using (public.is_admin() or user_id = auth.uid() or public.is_creditor_org_officer(organization_id));

drop policy if exists "creditor_officers_insert_admin_or_org_admin" on public.creditor_officers;
create policy "creditor_officers_insert_admin_or_org_admin"
on public.creditor_officers for insert
to authenticated
with check (public.is_admin() or user_id = auth.uid() or public.is_creditor_org_admin(organization_id));

drop policy if exists "creditor_officers_update_admin_or_org_admin" on public.creditor_officers;
create policy "creditor_officers_update_admin_or_org_admin"
on public.creditor_officers for update
to authenticated
using (public.is_admin() or public.is_creditor_org_admin(organization_id))
with check (public.is_admin() or public.is_creditor_org_admin(organization_id));

drop policy if exists "case_creditor_responses_select_participants" on public.case_creditor_responses;
create policy "case_creditor_responses_select_participants"
on public.case_creditor_responses for select
to authenticated
using (public.is_admin() or public.is_creditor_org_officer(organization_id));

drop policy if exists "case_creditor_responses_insert_org_officer" on public.case_creditor_responses;
create policy "case_creditor_responses_insert_org_officer"
on public.case_creditor_responses for insert
to authenticated
with check (public.is_admin() or public.is_creditor_org_officer(organization_id));

drop policy if exists "cases_select_owner_admin_mediator" on public.cases;
create policy "cases_select_owner_admin_mediator"
on public.cases for select
to authenticated
using (
  debtor_user_id = auth.uid()
  or assigned_mediator_id = auth.uid()
  or public.is_admin()
  or public.is_creditor_org_officer(creditor_organization_id)
);

drop policy if exists "cases_update_owner_draft_or_admin" on public.cases;
create policy "cases_update_owner_draft_or_admin"
on public.cases for update
to authenticated
using (
  public.is_admin()
  or assigned_mediator_id = auth.uid()
  or public.is_creditor_org_officer(creditor_organization_id)
  or (debtor_user_id = auth.uid() and status in ('draft', 'needs_more_info'))
)
with check (
  public.is_admin()
  or assigned_mediator_id = auth.uid()
  or public.is_creditor_org_officer(creditor_organization_id)
  or debtor_user_id = auth.uid()
);
