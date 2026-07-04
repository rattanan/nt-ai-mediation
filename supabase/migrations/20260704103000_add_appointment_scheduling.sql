do $$
begin
  create type public.appointment_status as enum (
    'requested',
    'pending_confirmation',
    'confirmed',
    'reschedule_requested',
    'completed',
    'cancelled',
    'no_show'
  );
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.meeting_type as enum ('online', 'onsite', 'hybrid');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.meeting_provider as enum ('manual_link', 'google_meet', 'zoom', 'other');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.appointment_participant_role as enum ('debtor', 'creditor_officer', 'mediator', 'admin');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.appointment_participant_status as enum ('pending', 'confirmed', 'reschedule_requested', 'declined', 'no_show');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.mediator_availability_slots (
  id uuid primary key default gen_random_uuid(),
  mediator_profile_id uuid not null references public.mediator_profiles(id) on delete cascade,
  slot_date date,
  day_of_week integer check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Bangkok',
  meeting_type public.meeting_type not null default 'online',
  is_recurring boolean not null default false,
  active boolean not null default true,
  max_cases_per_day integer not null default 3 check (max_cases_per_day > 0),
  max_cases_per_month integer not null default 20 check (max_cases_per_month > 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mediator_availability_slots_date_or_weekly check (
    (is_recurring = false and slot_date is not null)
    or (is_recurring = true and day_of_week is not null)
  ),
  constraint mediator_availability_slots_time_order check (end_time > start_time)
);

create table if not exists public.mediation_appointments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  mediator_id uuid not null references public.mediator_profiles(id) on delete cascade,
  debtor_user_id uuid not null references public.profiles(id) on delete cascade,
  creditor_organization_id uuid references public.creditor_organizations(id) on delete set null,
  creditor_officer_user_id uuid references public.profiles(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Bangkok',
  meeting_type public.meeting_type not null default 'online',
  meeting_url text,
  meeting_provider public.meeting_provider not null default 'manual_link',
  status public.appointment_status not null default 'requested',
  requested_by uuid references public.profiles(id) on delete set null default auth.uid(),
  confirmed_by_mediator_at timestamptz,
  confirmed_by_creditor_at timestamptz,
  confirmed_by_debtor_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mediation_appointments_time_order check (end_time > start_time)
);

create table if not exists public.appointment_participants (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.mediation_appointments(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.creditor_organizations(id) on delete set null,
  role public.appointment_participant_role not null,
  status public.appointment_participant_status not null default 'pending',
  note text,
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.mediation_appointments(id) on delete cascade,
  from_status public.appointment_status,
  to_status public.appointment_status not null,
  changed_by uuid references public.profiles(id) on delete set null default auth.uid(),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists mediator_availability_slots_profile_date_idx
on public.mediator_availability_slots(mediator_profile_id, active, slot_date, day_of_week);

create index if not exists mediation_appointments_case_idx
on public.mediation_appointments(case_id);

create index if not exists mediation_appointments_mediator_date_idx
on public.mediation_appointments(mediator_id, appointment_date, status);

create index if not exists mediation_appointments_debtor_idx
on public.mediation_appointments(debtor_user_id, appointment_date, status);

create index if not exists mediation_appointments_creditor_idx
on public.mediation_appointments(creditor_organization_id, appointment_date, status);

create index if not exists appointment_participants_appointment_idx
on public.appointment_participants(appointment_id);

create index if not exists appointment_status_history_appointment_idx
on public.appointment_status_history(appointment_id, created_at desc);

drop trigger if exists set_mediator_availability_slots_updated_at on public.mediator_availability_slots;
create trigger set_mediator_availability_slots_updated_at
before update on public.mediator_availability_slots
for each row execute function public.set_updated_at();

drop trigger if exists set_mediation_appointments_updated_at on public.mediation_appointments;
create trigger set_mediation_appointments_updated_at
before update on public.mediation_appointments
for each row execute function public.set_updated_at();

drop trigger if exists set_appointment_participants_updated_at on public.appointment_participants;
create trigger set_appointment_participants_updated_at
before update on public.appointment_participants
for each row execute function public.set_updated_at();

alter table public.mediator_availability_slots enable row level security;
alter table public.mediation_appointments enable row level security;
alter table public.appointment_participants enable row level security;
alter table public.appointment_status_history enable row level security;

drop policy if exists "availability_slots_select_scoped" on public.mediator_availability_slots;
create policy "availability_slots_select_scoped"
on public.mediator_availability_slots for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediator_availability_slots.mediator_profile_id
      and (mp.user_id = (select auth.uid()) or mp.status = 'approved')
  )
);

drop policy if exists "availability_slots_write_owner_admin" on public.mediator_availability_slots;
create policy "availability_slots_write_owner_admin"
on public.mediator_availability_slots for all
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediator_availability_slots.mediator_profile_id
      and mp.user_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediator_availability_slots.mediator_profile_id
      and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "appointments_select_parties_admin" on public.mediation_appointments;
create policy "appointments_select_parties_admin"
on public.mediation_appointments for select
to authenticated
using (
  public.is_admin()
  or debtor_user_id = (select auth.uid())
  or public.is_creditor_org_officer(creditor_organization_id)
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediation_appointments.mediator_id
      and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "appointments_insert_debtor_case" on public.mediation_appointments;
create policy "appointments_insert_debtor_case"
on public.mediation_appointments for insert
to authenticated
with check (
  debtor_user_id = (select auth.uid())
  and exists (
    select 1 from public.cases c
    where c.id = mediation_appointments.case_id
      and c.debtor_user_id = (select auth.uid())
      and c.selected_mediator_profile_id = mediation_appointments.mediator_id
  )
);

drop policy if exists "appointments_update_parties_admin" on public.mediation_appointments;
create policy "appointments_update_parties_admin"
on public.mediation_appointments for update
to authenticated
using (
  public.is_admin()
  or debtor_user_id = (select auth.uid())
  or public.is_creditor_org_officer(creditor_organization_id)
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediation_appointments.mediator_id
      and mp.user_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or debtor_user_id = (select auth.uid())
  or public.is_creditor_org_officer(creditor_organization_id)
  or exists (
    select 1 from public.mediator_profiles mp
    where mp.id = mediation_appointments.mediator_id
      and mp.user_id = (select auth.uid())
  )
);

drop policy if exists "participants_select_appointment_parties" on public.appointment_participants;
create policy "participants_select_appointment_parties"
on public.appointment_participants for select
to authenticated
using (
  exists (
    select 1 from public.mediation_appointments ma
    where ma.id = appointment_participants.appointment_id
      and (
        public.is_admin()
        or ma.debtor_user_id = (select auth.uid())
        or public.is_creditor_org_officer(ma.creditor_organization_id)
        or exists (
          select 1 from public.mediator_profiles mp
          where mp.id = ma.mediator_id and mp.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "participants_write_appointment_parties" on public.appointment_participants;
create policy "participants_write_appointment_parties"
on public.appointment_participants for all
to authenticated
using (
  exists (
    select 1 from public.mediation_appointments ma
    where ma.id = appointment_participants.appointment_id
      and (
        public.is_admin()
        or ma.debtor_user_id = (select auth.uid())
        or public.is_creditor_org_officer(ma.creditor_organization_id)
        or exists (
          select 1 from public.mediator_profiles mp
          where mp.id = ma.mediator_id and mp.user_id = (select auth.uid())
        )
      )
  )
)
with check (
  exists (
    select 1 from public.mediation_appointments ma
    where ma.id = appointment_participants.appointment_id
      and (
        public.is_admin()
        or ma.debtor_user_id = (select auth.uid())
        or public.is_creditor_org_officer(ma.creditor_organization_id)
        or exists (
          select 1 from public.mediator_profiles mp
          where mp.id = ma.mediator_id and mp.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "appointment_history_select_appointment_parties" on public.appointment_status_history;
create policy "appointment_history_select_appointment_parties"
on public.appointment_status_history for select
to authenticated
using (
  exists (
    select 1 from public.mediation_appointments ma
    where ma.id = appointment_status_history.appointment_id
      and (
        public.is_admin()
        or ma.debtor_user_id = (select auth.uid())
        or public.is_creditor_org_officer(ma.creditor_organization_id)
        or exists (
          select 1 from public.mediator_profiles mp
          where mp.id = ma.mediator_id and mp.user_id = (select auth.uid())
        )
      )
  )
);

drop policy if exists "appointment_history_insert_appointment_parties" on public.appointment_status_history;
create policy "appointment_history_insert_appointment_parties"
on public.appointment_status_history for insert
to authenticated
with check (
  exists (
    select 1 from public.mediation_appointments ma
    where ma.id = appointment_status_history.appointment_id
      and (
        public.is_admin()
        or ma.debtor_user_id = (select auth.uid())
        or public.is_creditor_org_officer(ma.creditor_organization_id)
        or exists (
          select 1 from public.mediator_profiles mp
          where mp.id = ma.mediator_id and mp.user_id = (select auth.uid())
        )
      )
  )
);
