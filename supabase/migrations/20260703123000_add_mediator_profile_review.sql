do $$
begin
  create type public.mediator_profile_status as enum (
    'draft',
    'submitted',
    'under_review',
    'needs_revision',
    'approved',
    'rejected',
    'suspended'
  );
exception
  when duplicate_object then null;
end $$;

alter type public.case_status add value if not exists 'mediator_selected';

create table if not exists public.mediator_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  title text,
  first_name text not null default '',
  last_name text not null default '',
  profile_photo_url text,
  citizen_id text,
  date_of_birth date,
  gender text,
  phone text,
  email text,
  address text,
  province text,
  district text,
  education_level text,
  education_detail text,
  occupation text,
  current_organization text,
  mediator_license_number text,
  mediator_registration_authority text,
  mediation_experience_years integer not null default 0,
  total_cases_handled integer not null default 0,
  successful_cases integer not null default 0,
  expertise_areas jsonb not null default '[]'::jsonb,
  debt_types_supported jsonb not null default '[]'::jsonb,
  languages jsonb not null default '[]'::jsonb,
  service_provinces jsonb not null default '[]'::jsonb,
  online_mediation_available boolean not null default true,
  onsite_mediation_available boolean not null default false,
  profile_summary text,
  status public.mediator_profile_status not null default 'draft',
  admin_review_note text,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mediator_certifications (
  id uuid primary key default gen_random_uuid(),
  mediator_profile_id uuid not null references public.mediator_profiles(id) on delete cascade,
  certification_name text not null,
  issuer text,
  issued_date date,
  certificate_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.mediator_experiences (
  id uuid primary key default gen_random_uuid(),
  mediator_profile_id uuid not null references public.mediator_profiles(id) on delete cascade,
  organization_name text,
  role_title text,
  case_type text,
  description text,
  start_year integer,
  end_year integer,
  created_at timestamptz not null default now()
);

create table if not exists public.mediator_specialties (
  id uuid primary key default gen_random_uuid(),
  mediator_profile_id uuid not null references public.mediator_profiles(id) on delete cascade,
  specialty text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mediator_availability (
  id uuid primary key default gen_random_uuid(),
  mediator_profile_id uuid not null references public.mediator_profiles(id) on delete cascade,
  available_days jsonb not null default '[]'::jsonb,
  available_time_slots jsonb not null default '[]'::jsonb,
  max_cases_per_month integer not null default 10,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mediator_documents (
  id uuid primary key default gen_random_uuid(),
  mediator_profile_id uuid not null references public.mediator_profiles(id) on delete cascade,
  document_type text not null,
  file_name text,
  file_url text not null,
  visibility text not null default 'admin_only' check (visibility in ('admin_only', 'public')),
  created_at timestamptz not null default now()
);

create table if not exists public.mediator_review_logs (
  id uuid primary key default gen_random_uuid(),
  mediator_profile_id uuid not null references public.mediator_profiles(id) on delete cascade,
  reviewer_profile_id uuid references public.profiles(id) on delete set null,
  from_status public.mediator_profile_status,
  to_status public.mediator_profile_status not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.cases
add column if not exists selected_mediator_profile_id uuid references public.mediator_profiles(id) on delete set null;

create index if not exists mediator_profiles_user_id_idx on public.mediator_profiles(user_id);
create index if not exists mediator_profiles_public_idx on public.mediator_profiles(status, province);
create index if not exists mediator_availability_profile_active_idx on public.mediator_availability(mediator_profile_id, active);
create unique index if not exists mediator_availability_profile_unique_idx on public.mediator_availability(mediator_profile_id);
create index if not exists cases_selected_mediator_profile_id_idx on public.cases(selected_mediator_profile_id);

drop trigger if exists set_mediator_profiles_updated_at on public.mediator_profiles;
create trigger set_mediator_profiles_updated_at
before update on public.mediator_profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_mediator_availability_updated_at on public.mediator_availability;
create trigger set_mediator_availability_updated_at
before update on public.mediator_availability
for each row execute function public.set_updated_at();

alter table public.mediator_profiles enable row level security;
alter table public.mediator_certifications enable row level security;
alter table public.mediator_experiences enable row level security;
alter table public.mediator_specialties enable row level security;
alter table public.mediator_availability enable row level security;
alter table public.mediator_documents enable row level security;
alter table public.mediator_review_logs enable row level security;

drop policy if exists "mediator_profiles_select_scoped" on public.mediator_profiles;
create policy "mediator_profiles_select_scoped"
on public.mediator_profiles for select
to authenticated
using (
  user_id = auth.uid()
  or public.is_admin()
  or status = 'approved'
);

drop policy if exists "mediator_profiles_insert_own" on public.mediator_profiles;
create policy "mediator_profiles_insert_own"
on public.mediator_profiles for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "mediator_profiles_update_own_or_admin" on public.mediator_profiles;
create policy "mediator_profiles_update_own_or_admin"
on public.mediator_profiles for update
to authenticated
using (
  public.is_admin()
  or user_id = auth.uid()
)
with check (
  public.is_admin()
  or (user_id = auth.uid() and status in ('draft', 'submitted', 'needs_revision'))
);

drop policy if exists "mediator_child_select_scoped" on public.mediator_certifications;
create policy "mediator_child_select_scoped"
on public.mediator_certifications for select
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.mediator_profiles mp where mp.id = mediator_certifications.mediator_profile_id and (mp.user_id = auth.uid() or mp.status = 'approved'))
);

drop policy if exists "mediator_child_write_owner" on public.mediator_certifications;
create policy "mediator_child_write_owner"
on public.mediator_certifications for all
to authenticated
using (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_certifications.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_certifications.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())));

drop policy if exists "mediator_experiences_select_scoped" on public.mediator_experiences;
create policy "mediator_experiences_select_scoped"
on public.mediator_experiences for select
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.mediator_profiles mp where mp.id = mediator_experiences.mediator_profile_id and (mp.user_id = auth.uid() or mp.status = 'approved'))
);

drop policy if exists "mediator_experiences_write_owner" on public.mediator_experiences;
create policy "mediator_experiences_write_owner"
on public.mediator_experiences for all
to authenticated
using (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_experiences.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_experiences.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())));

drop policy if exists "mediator_specialties_select_scoped" on public.mediator_specialties;
create policy "mediator_specialties_select_scoped"
on public.mediator_specialties for select
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.mediator_profiles mp where mp.id = mediator_specialties.mediator_profile_id and (mp.user_id = auth.uid() or mp.status = 'approved'))
);

drop policy if exists "mediator_specialties_write_owner" on public.mediator_specialties;
create policy "mediator_specialties_write_owner"
on public.mediator_specialties for all
to authenticated
using (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_specialties.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_specialties.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())));

drop policy if exists "mediator_availability_select_scoped" on public.mediator_availability;
create policy "mediator_availability_select_scoped"
on public.mediator_availability for select
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.mediator_profiles mp where mp.id = mediator_availability.mediator_profile_id and (mp.user_id = auth.uid() or mp.status = 'approved'))
);

drop policy if exists "mediator_availability_write_owner" on public.mediator_availability;
create policy "mediator_availability_write_owner"
on public.mediator_availability for all
to authenticated
using (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_availability.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_availability.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())));

drop policy if exists "mediator_documents_select_private" on public.mediator_documents;
create policy "mediator_documents_select_private"
on public.mediator_documents for select
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.mediator_profiles mp where mp.id = mediator_documents.mediator_profile_id and mp.user_id = auth.uid())
  or (visibility = 'public' and exists (select 1 from public.mediator_profiles mp where mp.id = mediator_documents.mediator_profile_id and mp.status = 'approved'))
);

drop policy if exists "mediator_documents_write_owner" on public.mediator_documents;
create policy "mediator_documents_write_owner"
on public.mediator_documents for all
to authenticated
using (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_documents.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())))
with check (exists (select 1 from public.mediator_profiles mp where mp.id = mediator_documents.mediator_profile_id and (mp.user_id = auth.uid() or public.is_admin())));

drop policy if exists "mediator_review_logs_select_admin_owner" on public.mediator_review_logs;
create policy "mediator_review_logs_select_admin_owner"
on public.mediator_review_logs for select
to authenticated
using (
  public.is_admin()
  or exists (select 1 from public.mediator_profiles mp where mp.id = mediator_review_logs.mediator_profile_id and mp.user_id = auth.uid())
);

drop policy if exists "mediator_review_logs_insert_admin" on public.mediator_review_logs;
create policy "mediator_review_logs_insert_admin"
on public.mediator_review_logs for insert
to authenticated
with check (public.is_admin());
