do $$
begin
  create type public.case_status as enum (
    'draft',
    'submitted',
    'reviewing',
    'admin_review',
    'needs_more_info',
    'creditor_review',
    'creditor_accepted',
    'creditor_rejected',
    'matched',
    'mediator_matching',
    'scheduled',
    'appointment_scheduling',
    'in_mediation',
    'settlement_draft',
    'settled',
    'not_settled',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.creditor_campaign_status as enum (
    'draft',
    'pending_review',
    'published',
    'expired'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.case_status add value if not exists 'admin_review';
alter type public.case_status add value if not exists 'creditor_review';
alter type public.case_status add value if not exists 'creditor_accepted';
alter type public.case_status add value if not exists 'creditor_rejected';
alter type public.case_status add value if not exists 'mediator_matching';
alter type public.case_status add value if not exists 'appointment_scheduling';
alter type public.case_status add value if not exists 'settlement_draft';

do $$
begin
  create type public.creditor_organization_status as enum (
    'pending',
    'approved',
    'rejected',
    'suspended'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.creditor_officer_role as enum (
    'creditor_admin',
    'creditor_staff',
    'creditor_approver'
  );
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

alter table public.creditor_organizations
add column if not exists logo_url text,
add column if not exists short_name text,
add column if not exists website text,
add column if not exists is_public boolean not null default false,
add column if not exists display_order integer not null default 100;

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
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_creditor_org_officer(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.creditor_officers officer
    where officer.organization_id = org_id
      and officer.user_id = auth.uid()
      and officer.status = 'active'
  );
$$;

create or replace function public.is_creditor_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.creditor_officers officer
    where officer.organization_id = org_id
      and officer.user_id = auth.uid()
      and officer.status = 'active'
      and officer.role in ('creditor_admin', 'creditor_approver')
  );
$$;

create table if not exists public.creditor_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.creditor_organizations(id) on delete cascade,
  title text not null,
  subtitle text,
  description text not null,
  campaign_image_url text,
  campaign_start_date date,
  campaign_end_date date,
  conditions jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  required_documents jsonb not null default '[]'::jsonb,
  faqs jsonb not null default '[]'::jsonb,
  target_debt_type text,
  target_province text,
  call_to_action_text text,
  button_text text not null default 'สมัครเข้าร่วมโครงการ',
  button_link text,
  status public.creditor_campaign_status not null default 'draft',
  is_featured boolean not null default false,
  display_order integer not null default 100,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique default ('NTM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6))),
  debtor_user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  assigned_mediator_id uuid references public.profiles(id) on delete set null,
  creditor_organization_id uuid references public.creditor_organizations(id) on delete set null,
  creditor_name text not null,
  creditor_type text not null,
  debt_type text not null,
  debt_amount numeric(14, 2) not null check (debt_amount >= 0),
  overdue_months integer not null default 0 check (overdue_months >= 0),
  province text not null,
  district text not null,
  contact_phone text not null,
  problem_description text not null,
  desired_solution text not null,
  status public.case_status not null default 'draft',
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.cases
add column if not exists creditor_campaign_id uuid references public.creditor_campaigns(id) on delete set null,
add column if not exists contract_number text,
add column if not exists account_number text,
add column if not exists monthly_income numeric(14, 2),
add column if not exists monthly_expense numeric(14, 2),
add column if not exists affordable_monthly_payment numeric(14, 2),
add column if not exists admin_review_note text,
add column if not exists creditor_response_note text,
add column if not exists rejection_reason text,
add column if not exists uploaded_documents jsonb not null default '[]'::jsonb;

create table if not exists public.case_comments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  author_profile_id uuid references public.profiles(id) on delete set null default auth.uid(),
  audience text not null default 'internal' check (audience in ('internal', 'debtor', 'creditor')),
  comment text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.case_status_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  from_status public.case_status,
  to_status public.case_status not null,
  changed_by uuid references public.profiles(id) on delete set null default auth.uid(),
  note text,
  created_at timestamptz not null default now()
);

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

create index if not exists creditor_organizations_public_idx
on public.creditor_organizations(status, is_public, display_order);

create index if not exists creditor_campaigns_org_status_idx
on public.creditor_campaigns(organization_id, status, is_featured, display_order);

create index if not exists cases_creditor_campaign_id_idx
on public.cases(creditor_campaign_id);

create index if not exists case_comments_case_id_idx
on public.case_comments(case_id);

drop trigger if exists set_creditor_campaigns_updated_at on public.creditor_campaigns;
create trigger set_creditor_campaigns_updated_at
before update on public.creditor_campaigns
for each row execute function public.set_updated_at();

alter table public.creditor_campaigns enable row level security;
alter table public.case_comments enable row level security;
alter table public.cases enable row level security;
alter table public.case_status_history enable row level security;
alter table public.case_creditor_responses enable row level security;

drop policy if exists "creditor_campaigns_public_published" on public.creditor_campaigns;
create policy "creditor_campaigns_public_published"
on public.creditor_campaigns for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1
    from public.creditor_organizations org
    where org.id = creditor_campaigns.organization_id
      and org.status = 'approved'
      and org.is_public = true
  )
);

drop policy if exists "creditor_campaigns_admin_all" on public.creditor_campaigns;
create policy "creditor_campaigns_admin_all"
on public.creditor_campaigns for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "creditor_campaigns_officer_select" on public.creditor_campaigns;
create policy "creditor_campaigns_officer_select"
on public.creditor_campaigns for select
to authenticated
using (public.is_creditor_org_officer(organization_id));

drop policy if exists "creditor_campaigns_officer_insert" on public.creditor_campaigns;
create policy "creditor_campaigns_officer_insert"
on public.creditor_campaigns for insert
to authenticated
with check (
  public.is_creditor_org_admin(organization_id)
  and status in ('draft', 'pending_review')
);

drop policy if exists "creditor_campaigns_officer_update" on public.creditor_campaigns;
create policy "creditor_campaigns_officer_update"
on public.creditor_campaigns for update
to authenticated
using (
  public.is_creditor_org_admin(organization_id)
  and status in ('draft', 'pending_review')
)
with check (
  public.is_creditor_org_admin(organization_id)
  and status in ('draft', 'pending_review')
);

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

drop policy if exists "case_comments_select_participants" on public.case_comments;
create policy "case_comments_select_participants"
on public.case_comments for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.cases c
    where c.id = case_comments.case_id
      and (
        c.debtor_user_id = auth.uid()
        or c.assigned_mediator_id = auth.uid()
        or public.is_creditor_org_officer(c.creditor_organization_id)
      )
  )
);

drop policy if exists "case_comments_insert_participants" on public.case_comments;
create policy "case_comments_insert_participants"
on public.case_comments for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.cases c
    where c.id = case_comments.case_id
      and (
        c.debtor_user_id = auth.uid()
        or c.assigned_mediator_id = auth.uid()
        or public.is_creditor_org_officer(c.creditor_organization_id)
      )
  )
);
