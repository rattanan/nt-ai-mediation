do $$ begin
  create type public.mediation_result_status as enum ('settled', 'not_settled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_frequency as enum ('monthly', 'biweekly', 'weekly', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.settlement_document_type as enum ('settlement_agreement', 'unsuccessful_closing_report');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.billing_invoice_status as enum ('draft', 'issued', 'sent', 'paid', 'overdue', 'cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.fee_settings (
  id uuid primary key default gen_random_uuid(),
  platform_fee_percent numeric(7, 2) not null default 3,
  success_fee_percent numeric(7, 2) not null default 10,
  currency text not null default 'THB',
  vat_percent numeric(7, 2) not null default 0,
  invoice_prefix text not null default 'NTINV',
  payment_due_days integer not null default 15,
  bank_account_name text,
  bank_account_number text,
  bank_name text,
  fee_policy_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.fee_settings (platform_fee_percent, success_fee_percent, currency, invoice_prefix, payment_due_days)
select 3, 10, 'THB', 'NTINV', 15
where not exists (select 1 from public.fee_settings);

create table if not exists public.mediation_closing_records (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  appointment_id uuid references public.mediation_appointments(id) on delete set null,
  mediator_id uuid not null references public.mediator_profiles(id) on delete restrict,
  debtor_user_id uuid not null references public.profiles(id) on delete cascade,
  creditor_organization_id uuid references public.creditor_organizations(id) on delete set null,
  result_status public.mediation_result_status not null,
  original_debt_amount numeric(14, 2) not null check (original_debt_amount >= 0),
  settled_amount numeric(14, 2) check (settled_amount >= 0),
  settlement_summary text,
  unsuccessful_reason text,
  mediator_note text,
  closed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlement_payment_plans (
  id uuid primary key default gen_random_uuid(),
  closing_record_id uuid not null references public.mediation_closing_records(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  total_settlement_amount numeric(14, 2) not null check (total_settlement_amount >= 0),
  down_payment_amount numeric(14, 2) not null default 0 check (down_payment_amount >= 0),
  installment_amount numeric(14, 2) not null default 0 check (installment_amount >= 0),
  number_of_installments integer not null default 1 check (number_of_installments > 0),
  first_payment_due_date date,
  payment_frequency public.payment_frequency not null default 'monthly',
  payment_method text,
  special_terms text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.settlement_documents (
  id uuid primary key default gen_random_uuid(),
  closing_record_id uuid not null references public.mediation_closing_records(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  document_type public.settlement_document_type not null,
  pdf_url text,
  generated_at timestamptz not null default now(),
  sent_to_debtor_at timestamptz,
  sent_to_creditor_at timestamptz,
  sent_to_mediator_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  case_id uuid not null references public.cases(id) on delete cascade,
  closing_record_id uuid not null references public.mediation_closing_records(id) on delete cascade,
  creditor_organization_id uuid references public.creditor_organizations(id) on delete set null,
  original_debt_amount numeric(14, 2) not null default 0,
  settled_amount numeric(14, 2),
  platform_fee_percent numeric(7, 2) not null default 0,
  platform_fee_amount numeric(14, 2) not null default 0,
  success_fee_percent numeric(7, 2) not null default 0,
  success_fee_amount numeric(14, 2) not null default 0,
  vat_percent numeric(7, 2) not null default 0,
  vat_amount numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  status public.billing_invoice_status not null default 'issued',
  issued_at timestamptz not null default now(),
  due_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.billing_invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.billing_invoices(id) on delete cascade,
  item_name text not null,
  description text,
  calculation_base_amount numeric(14, 2) not null default 0,
  fee_percent numeric(7, 2) not null default 0,
  amount numeric(14, 2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade,
  recipient_email text,
  recipient_role text not null,
  subject text not null,
  template_name text not null,
  status text not null default 'queued',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists mediation_closing_records_case_idx on public.mediation_closing_records(case_id);
create index if not exists settlement_documents_case_idx on public.settlement_documents(case_id);
create index if not exists billing_invoices_creditor_status_idx on public.billing_invoices(creditor_organization_id, status);
create index if not exists email_logs_case_idx on public.email_logs(case_id);

drop trigger if exists set_fee_settings_updated_at on public.fee_settings;
create trigger set_fee_settings_updated_at before update on public.fee_settings
for each row execute function public.set_updated_at();
drop trigger if exists set_mediation_closing_records_updated_at on public.mediation_closing_records;
create trigger set_mediation_closing_records_updated_at before update on public.mediation_closing_records
for each row execute function public.set_updated_at();
drop trigger if exists set_settlement_payment_plans_updated_at on public.settlement_payment_plans;
create trigger set_settlement_payment_plans_updated_at before update on public.settlement_payment_plans
for each row execute function public.set_updated_at();
drop trigger if exists set_billing_invoices_updated_at on public.billing_invoices;
create trigger set_billing_invoices_updated_at before update on public.billing_invoices
for each row execute function public.set_updated_at();

alter table public.fee_settings enable row level security;
alter table public.mediation_closing_records enable row level security;
alter table public.settlement_payment_plans enable row level security;
alter table public.settlement_documents enable row level security;
alter table public.billing_invoices enable row level security;
alter table public.billing_invoice_items enable row level security;
alter table public.email_logs enable row level security;

drop policy if exists "fee_settings_select_admin" on public.fee_settings;
create policy "fee_settings_select_admin" on public.fee_settings for select to authenticated using (public.is_admin());
drop policy if exists "fee_settings_manage_admin" on public.fee_settings;
create policy "fee_settings_manage_admin" on public.fee_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "closing_select_parties" on public.mediation_closing_records;
create policy "closing_select_parties" on public.mediation_closing_records for select to authenticated using (
  public.is_admin() or debtor_user_id = (select auth.uid()) or public.is_creditor_org_officer(creditor_organization_id)
  or exists (select 1 from public.mediator_profiles mp where mp.id = mediation_closing_records.mediator_id and mp.user_id = (select auth.uid()))
);
drop policy if exists "closing_insert_mediator" on public.mediation_closing_records;
create policy "closing_insert_mediator" on public.mediation_closing_records for insert to authenticated with check (
  public.is_admin()
  or exists (select 1 from public.mediator_profiles mp join public.cases c on c.selected_mediator_profile_id = mp.id where mp.id = mediator_id and mp.user_id = (select auth.uid()) and c.id = case_id)
);

drop policy if exists "plans_select_parties" on public.settlement_payment_plans;
create policy "plans_select_parties" on public.settlement_payment_plans for select to authenticated using (
  exists (select 1 from public.mediation_closing_records r where r.id = settlement_payment_plans.closing_record_id and (
    public.is_admin() or r.debtor_user_id = (select auth.uid()) or public.is_creditor_org_officer(r.creditor_organization_id)
    or exists (select 1 from public.mediator_profiles mp where mp.id = r.mediator_id and mp.user_id = (select auth.uid()))
  ))
);
drop policy if exists "plans_insert_mediator" on public.settlement_payment_plans;
create policy "plans_insert_mediator" on public.settlement_payment_plans for insert to authenticated with check (
  exists (select 1 from public.mediation_closing_records r join public.mediator_profiles mp on mp.id = r.mediator_id where r.id = closing_record_id and (public.is_admin() or mp.user_id = (select auth.uid())))
);

drop policy if exists "documents_select_parties" on public.settlement_documents;
create policy "documents_select_parties" on public.settlement_documents for select to authenticated using (
  exists (select 1 from public.mediation_closing_records r where r.id = settlement_documents.closing_record_id and (
    public.is_admin() or r.debtor_user_id = (select auth.uid()) or public.is_creditor_org_officer(r.creditor_organization_id)
    or exists (select 1 from public.mediator_profiles mp where mp.id = r.mediator_id and mp.user_id = (select auth.uid()))
  ))
);
drop policy if exists "documents_insert_mediator_admin" on public.settlement_documents;
create policy "documents_insert_mediator_admin" on public.settlement_documents for insert to authenticated with check (
  exists (select 1 from public.mediation_closing_records r join public.mediator_profiles mp on mp.id = r.mediator_id where r.id = closing_record_id and (public.is_admin() or mp.user_id = (select auth.uid())))
);

drop policy if exists "invoices_select_creditor_admin" on public.billing_invoices;
create policy "invoices_select_creditor_admin" on public.billing_invoices for select to authenticated using (
  public.is_admin() or public.is_creditor_org_officer(creditor_organization_id)
);
drop policy if exists "invoices_insert_mediator_admin" on public.billing_invoices;
create policy "invoices_insert_mediator_admin" on public.billing_invoices for insert to authenticated with check (
  public.is_admin()
  or exists (select 1 from public.mediation_closing_records r join public.mediator_profiles mp on mp.id = r.mediator_id where r.id = closing_record_id and mp.user_id = (select auth.uid()))
);
drop policy if exists "invoices_update_admin" on public.billing_invoices;
create policy "invoices_update_admin" on public.billing_invoices for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "invoice_items_select_creditor_admin" on public.billing_invoice_items;
create policy "invoice_items_select_creditor_admin" on public.billing_invoice_items for select to authenticated using (
  exists (select 1 from public.billing_invoices i where i.id = billing_invoice_items.invoice_id and (public.is_admin() or public.is_creditor_org_officer(i.creditor_organization_id)))
);
drop policy if exists "invoice_items_insert_invoice_creator" on public.billing_invoice_items;
create policy "invoice_items_insert_invoice_creator" on public.billing_invoice_items for insert to authenticated with check (
  exists (select 1 from public.billing_invoices i join public.mediation_closing_records r on r.id = i.closing_record_id join public.mediator_profiles mp on mp.id = r.mediator_id where i.id = invoice_id and (public.is_admin() or mp.user_id = (select auth.uid())))
);

drop policy if exists "email_logs_select_admin" on public.email_logs;
create policy "email_logs_select_admin" on public.email_logs for select to authenticated using (public.is_admin());
drop policy if exists "email_logs_insert_authenticated" on public.email_logs;
create policy "email_logs_insert_authenticated" on public.email_logs for insert to authenticated with check ((select auth.uid()) is not null);
