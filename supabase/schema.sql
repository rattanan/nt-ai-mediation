create extension if not exists "pgcrypto";

do $$
begin
  create type public.app_role as enum ('debtor', 'mediator', 'creditor', 'admin');
exception
  when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'debtor',
  full_name text not null,
  phone text,
  organization_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.creditors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  tax_id text,
  contact_name text,
  contact_email text,
  contact_phone text,
  address text,
  created_by uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mediators (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  license_no text,
  expertise text[] not null default '{}',
  service_area text,
  active boolean not null default true,
  max_active_cases integer not null default 20 check (max_active_cases > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.debtor_cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique default ('NT-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  debtor_profile_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  creditor_id uuid references public.creditors(id) on delete set null,
  mediator_id uuid references public.mediators(id) on delete set null,
  debt_amount numeric(14, 2) not null check (debt_amount >= 0),
  debt_type text not null,
  status text not null default 'draft' check (
    status in ('draft', 'submitted', 'ai_interview', 'matching', 'scheduled', 'in_mediation', 'settled', 'closed', 'cancelled')
  ),
  ai_summary text,
  debtor_notes text,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mediation_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.debtor_cases(id) on delete cascade,
  mediator_id uuid references public.mediators(id) on delete set null,
  scheduled_at timestamptz not null,
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  channel text not null default 'online' check (channel in ('online', 'phone', 'onsite')),
  meeting_url text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlement_agreements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.debtor_cases(id) on delete cascade,
  session_id uuid references public.mediation_sessions(id) on delete set null,
  total_amount numeric(14, 2) not null check (total_amount >= 0),
  monthly_payment numeric(14, 2) check (monthly_payment is null or monthly_payment >= 0),
  start_date date,
  end_date date,
  terms text not null,
  status text not null default 'draft' check (status in ('draft', 'proposed', 'accepted', 'active', 'completed', 'defaulted', 'cancelled')),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.debtor_cases(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null default auth.uid(),
  document_type text not null,
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null default auth.uid(),
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists creditors_profile_id_idx on public.creditors(profile_id);
create index if not exists mediators_profile_id_idx on public.mediators(profile_id);
create index if not exists debtor_cases_debtor_profile_id_idx on public.debtor_cases(debtor_profile_id);
create index if not exists debtor_cases_creditor_id_idx on public.debtor_cases(creditor_id);
create index if not exists debtor_cases_mediator_id_idx on public.debtor_cases(mediator_id);
create index if not exists mediation_sessions_case_id_idx on public.mediation_sessions(case_id);
create index if not exists mediation_sessions_mediator_id_idx on public.mediation_sessions(mediator_id);
create index if not exists settlement_agreements_case_id_idx on public.settlement_agreements(case_id);
create index if not exists case_documents_case_id_idx on public.case_documents(case_id);
create index if not exists audit_logs_actor_profile_id_idx on public.audit_logs(actor_profile_id);
create index if not exists audit_logs_entity_idx on public.audit_logs(entity_table, entity_id);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_creditors_updated_at on public.creditors;
create trigger set_creditors_updated_at
before update on public.creditors
for each row execute function public.set_updated_at();

drop trigger if exists set_mediators_updated_at on public.mediators;
create trigger set_mediators_updated_at
before update on public.mediators
for each row execute function public.set_updated_at();

drop trigger if exists set_debtor_cases_updated_at on public.debtor_cases;
create trigger set_debtor_cases_updated_at
before update on public.debtor_cases
for each row execute function public.set_updated_at();

drop trigger if exists set_mediation_sessions_updated_at on public.mediation_sessions;
create trigger set_mediation_sessions_updated_at
before update on public.mediation_sessions
for each row execute function public.set_updated_at();

drop trigger if exists set_settlement_agreements_updated_at on public.settlement_agreements;
create trigger set_settlement_agreements_updated_at
before update on public.settlement_agreements
for each row execute function public.set_updated_at();

create or replace function public.current_app_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(public.current_app_role() = 'admin', false)
$$;

alter table public.profiles enable row level security;
alter table public.creditors enable row level security;
alter table public.mediators enable row level security;
alter table public.debtor_cases enable row level security;
alter table public.mediation_sessions enable row level security;
alter table public.settlement_agreements enable row level security;
alter table public.case_documents enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "creditors_select_linked_or_admin" on public.creditors;
create policy "creditors_select_linked_or_admin"
on public.creditors for select
to authenticated
using (profile_id = auth.uid() or created_by = auth.uid() or public.is_admin());

drop policy if exists "creditors_insert_creditor_or_admin" on public.creditors;
create policy "creditors_insert_creditor_or_admin"
on public.creditors for insert
to authenticated
with check (created_by = auth.uid() and (public.current_app_role() in ('creditor', 'admin')));

drop policy if exists "creditors_update_linked_or_admin" on public.creditors;
create policy "creditors_update_linked_or_admin"
on public.creditors for update
to authenticated
using (profile_id = auth.uid() or created_by = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or created_by = auth.uid() or public.is_admin());

drop policy if exists "mediators_select_self_or_admin" on public.mediators;
create policy "mediators_select_self_or_admin"
on public.mediators for select
to authenticated
using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "mediators_insert_self_or_admin" on public.mediators;
create policy "mediators_insert_self_or_admin"
on public.mediators for insert
to authenticated
with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "mediators_update_self_or_admin" on public.mediators;
create policy "mediators_update_self_or_admin"
on public.mediators for update
to authenticated
using (profile_id = auth.uid() or public.is_admin())
with check (profile_id = auth.uid() or public.is_admin());

drop policy if exists "debtor_cases_select_participants_or_admin" on public.debtor_cases;
create policy "debtor_cases_select_participants_or_admin"
on public.debtor_cases for select
to authenticated
using (
  debtor_profile_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.mediators
    where mediators.id = debtor_cases.mediator_id
      and mediators.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.creditors
    where creditors.id = debtor_cases.creditor_id
      and creditors.profile_id = auth.uid()
  )
);

drop policy if exists "debtor_cases_insert_own" on public.debtor_cases;
create policy "debtor_cases_insert_own"
on public.debtor_cases for insert
to authenticated
with check (debtor_profile_id = auth.uid() or public.is_admin());

drop policy if exists "debtor_cases_update_participants_or_admin" on public.debtor_cases;
create policy "debtor_cases_update_participants_or_admin"
on public.debtor_cases for update
to authenticated
using (
  debtor_profile_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.mediators
    where mediators.id = debtor_cases.mediator_id
      and mediators.profile_id = auth.uid()
  )
)
with check (
  debtor_profile_id = auth.uid()
  or public.is_admin()
  or exists (
    select 1 from public.mediators
    where mediators.id = debtor_cases.mediator_id
      and mediators.profile_id = auth.uid()
  )
);

drop policy if exists "mediation_sessions_select_participants_or_admin" on public.mediation_sessions;
create policy "mediation_sessions_select_participants_or_admin"
on public.mediation_sessions for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.debtor_cases
    where debtor_cases.id = mediation_sessions.case_id
      and debtor_cases.debtor_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.mediators
    where mediators.id = mediation_sessions.mediator_id
      and mediators.profile_id = auth.uid()
  )
);

drop policy if exists "mediation_sessions_write_mediator_or_admin" on public.mediation_sessions;
create policy "mediation_sessions_write_mediator_or_admin"
on public.mediation_sessions for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.mediators
    where mediators.id = mediation_sessions.mediator_id
      and mediators.profile_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.mediators
    where mediators.id = mediation_sessions.mediator_id
      and mediators.profile_id = auth.uid()
  )
);

drop policy if exists "settlement_agreements_select_participants_or_admin" on public.settlement_agreements;
create policy "settlement_agreements_select_participants_or_admin"
on public.settlement_agreements for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.debtor_cases
    where debtor_cases.id = settlement_agreements.case_id
      and debtor_cases.debtor_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.debtor_cases
    join public.mediators on mediators.id = debtor_cases.mediator_id
    where debtor_cases.id = settlement_agreements.case_id
      and mediators.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.debtor_cases
    join public.creditors on creditors.id = debtor_cases.creditor_id
    where debtor_cases.id = settlement_agreements.case_id
      and creditors.profile_id = auth.uid()
  )
);

drop policy if exists "settlement_agreements_write_mediator_or_admin" on public.settlement_agreements;
create policy "settlement_agreements_write_mediator_or_admin"
on public.settlement_agreements for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.debtor_cases
    join public.mediators on mediators.id = debtor_cases.mediator_id
    where debtor_cases.id = settlement_agreements.case_id
      and mediators.profile_id = auth.uid()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.debtor_cases
    join public.mediators on mediators.id = debtor_cases.mediator_id
    where debtor_cases.id = settlement_agreements.case_id
      and mediators.profile_id = auth.uid()
  )
);

drop policy if exists "case_documents_select_participants_or_admin" on public.case_documents;
create policy "case_documents_select_participants_or_admin"
on public.case_documents for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.debtor_cases
    where debtor_cases.id = case_documents.case_id
      and debtor_cases.debtor_profile_id = auth.uid()
  )
  or exists (
    select 1 from public.debtor_cases
    join public.mediators on mediators.id = debtor_cases.mediator_id
    where debtor_cases.id = case_documents.case_id
      and mediators.profile_id = auth.uid()
  )
  or exists (
    select 1 from public.debtor_cases
    join public.creditors on creditors.id = debtor_cases.creditor_id
    where debtor_cases.id = case_documents.case_id
      and creditors.profile_id = auth.uid()
  )
);

drop policy if exists "case_documents_insert_participants_or_admin" on public.case_documents;
create policy "case_documents_insert_participants_or_admin"
on public.case_documents for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and (
    public.is_admin()
    or exists (
      select 1 from public.debtor_cases
      where debtor_cases.id = case_documents.case_id
        and debtor_cases.debtor_profile_id = auth.uid()
    )
    or exists (
      select 1 from public.debtor_cases
      join public.mediators on mediators.id = debtor_cases.mediator_id
      where debtor_cases.id = case_documents.case_id
        and mediators.profile_id = auth.uid()
    )
  )
);

drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
on public.audit_logs for select
to authenticated
using (public.is_admin());

drop policy if exists "audit_logs_insert_authenticated" on public.audit_logs;
create policy "audit_logs_insert_authenticated"
on public.audit_logs for insert
to authenticated
with check (actor_profile_id = auth.uid() or public.is_admin());
