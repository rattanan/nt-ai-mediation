do $$
begin
  create type public.case_status as enum (
    'draft',
    'submitted',
    'reviewing',
    'needs_more_info',
    'matched',
    'scheduled',
    'in_mediation',
    'settled',
    'not_settled',
    'closed'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  case_number text not null unique default ('NTM-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(gen_random_uuid()::text, 1, 6))),
  debtor_user_id uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  assigned_mediator_id uuid references public.profiles(id) on delete set null,
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

alter table public.case_documents
add column if not exists mediation_case_id uuid references public.cases(id) on delete cascade;

create table if not exists public.case_status_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  from_status public.case_status,
  to_status public.case_status not null,
  changed_by uuid references public.profiles(id) on delete set null default auth.uid(),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists cases_debtor_user_id_idx on public.cases(debtor_user_id);
create index if not exists cases_assigned_mediator_id_idx on public.cases(assigned_mediator_id);
create index if not exists cases_status_idx on public.cases(status);
create index if not exists case_documents_mediation_case_id_idx on public.case_documents(mediation_case_id);
create index if not exists case_status_history_case_id_idx on public.case_status_history(case_id);

drop trigger if exists set_cases_updated_at on public.cases;
create trigger set_cases_updated_at
before update on public.cases
for each row execute function public.set_updated_at();

alter table public.cases enable row level security;
alter table public.case_status_history enable row level security;

drop policy if exists "cases_select_owner_admin_mediator" on public.cases;
create policy "cases_select_owner_admin_mediator"
on public.cases for select
to authenticated
using (
  debtor_user_id = auth.uid()
  or assigned_mediator_id = auth.uid()
  or public.is_admin()
);

drop policy if exists "cases_insert_owner" on public.cases;
create policy "cases_insert_owner"
on public.cases for insert
to authenticated
with check (debtor_user_id = auth.uid());

drop policy if exists "cases_update_owner_draft_or_admin" on public.cases;
create policy "cases_update_owner_draft_or_admin"
on public.cases for update
to authenticated
using (
  public.is_admin()
  or assigned_mediator_id = auth.uid()
  or (debtor_user_id = auth.uid() and status in ('draft', 'needs_more_info'))
)
with check (
  public.is_admin()
  or assigned_mediator_id = auth.uid()
  or debtor_user_id = auth.uid()
);

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
      and (c.debtor_user_id = auth.uid() or c.assigned_mediator_id = auth.uid())
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
      and (c.debtor_user_id = auth.uid() or c.assigned_mediator_id = auth.uid())
  )
);
