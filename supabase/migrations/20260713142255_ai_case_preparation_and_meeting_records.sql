-- AI case preparation and Google Meet mediation records.
-- Raw OCR/transcript artifacts stay private to staff; parties only receive the
-- debtor-safe assessment fields and approved meeting minutes.

alter table public.mediation_appointments
  add column if not exists calendar_event_id text,
  add column if not exists meet_space_name text,
  add column if not exists meeting_code text,
  add column if not exists organizer_email text,
  add column if not exists google_sync_status text not null default 'not_created'
    check (google_sync_status in ('not_created', 'creating', 'synced', 'updating', 'cancelling', 'cancelled', 'failed')),
  add column if not exists google_sync_error text,
  add column if not exists recording_status text not null default 'not_requested'
    check (recording_status in ('not_requested', 'waiting_consent', 'enabled', 'disabled', 'processing', 'ready', 'failed')),
  add column if not exists meeting_created_by uuid references public.profiles(id) on delete set null,
  add column if not exists artifact_poll_after timestamptz;

create unique index if not exists mediation_appointments_calendar_event_id_uidx
  on public.mediation_appointments(calendar_event_id) where calendar_event_id is not null;
create index if not exists mediation_appointments_google_sync_idx
  on public.mediation_appointments(google_sync_status, artifact_poll_after);

create table public.case_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null default auth.uid(),
  storage_path text not null unique,
  file_name text not null,
  mime_type text,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  page_count integer check (page_count is null or page_count > 0),
  ocr_status text not null default 'pending'
    check (ocr_status in ('pending', 'processing', 'completed', 'failed', 'manual_bypass')),
  ocr_text text,
  ocr_confidence numeric(5,4) check (ocr_confidence is null or ocr_confidence between 0 and 1),
  extracted_fields jsonb not null default '{}'::jsonb,
  confirmed_fields jsonb not null default '{}'::jsonb,
  retry_count integer not null default 0 check (retry_count between 0 and 3),
  last_error text,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_ai_sessions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null unique references public.cases(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'interview', 'ready', 'completed', 'failed', 'manual_bypass')),
  summary text,
  strengths jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  missing_fields jsonb not null default '[]'::jsonb,
  question_count integer not null default 0 check (question_count between 0 and 10),
  bypass_reason text,
  prompt_version text not null default 'case-prep-v1',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_ai_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.case_ai_sessions(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  sequence integer not null check (sequence >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (session_id, sequence)
);

create table public.case_ai_assessments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  session_id uuid not null references public.case_ai_sessions(id) on delete cascade,
  version integer not null default 1 check (version > 0),
  risk_score integer not null check (risk_score between 0 and 100),
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  factors jsonb not null default '{}'::jsonb,
  risks jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  benefits jsonb not null default '[]'::jsonb,
  rationale text not null,
  model text,
  prompt_version text not null default 'assessment-v1',
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'needs_correction')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  unique (case_id, version)
);

create table public.case_payment_plans (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  assessment_id uuid not null references public.case_ai_assessments(id) on delete cascade,
  plan_type text not null check (plan_type in ('light_payment', 'fast_close')),
  principal_amount numeric(14,2) not null check (principal_amount >= 0),
  assumed_interest_rate numeric(7,4) not null default 0 check (assumed_interest_rate >= 0),
  assumed_discount_rate numeric(7,4) not null default 0 check (assumed_discount_rate between 0 and 100),
  monthly_payment numeric(14,2) not null check (monthly_payment > 0),
  term_months integer not null check (term_months between 1 and 120),
  total_payment numeric(14,2) not null check (total_payment >= 0),
  assumptions jsonb not null default '{}'::jsonb,
  status text not null default 'proposed' check (status in ('proposed', 'selected', 'superseded')),
  selected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (assessment_id, plan_type)
);

create unique index case_payment_plans_one_selected_per_case
  on public.case_payment_plans(case_id) where status = 'selected';

create table public.ai_rate_policies (
  id uuid primary key default gen_random_uuid(),
  debt_type text not null unique,
  min_interest_rate numeric(7,4) not null default 0 check (min_interest_rate >= 0),
  max_interest_rate numeric(7,4) not null default 0 check (max_interest_rate >= min_interest_rate),
  min_discount_rate numeric(7,4) not null default 0 check (min_discount_rate between 0 and 100),
  max_discount_rate numeric(7,4) not null default 0 check (max_discount_rate between min_discount_rate and 100),
  active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.ai_rate_policies (debt_type, min_interest_rate, max_interest_rate, min_discount_rate, max_discount_rate)
values ('*', 0, 15, 0, 20)
on conflict (debt_type) do nothing;

create table public.ai_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  document_id uuid references public.case_documents(id) on delete cascade,
  job_type text not null check (job_type in ('ocr', 'interview', 'assessment')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'manual_bypass')),
  attempts integer not null default 0 check (attempts between 0 and 3),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  last_error text,
  available_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.appointment_recording_consents (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.mediation_appointments(id) on delete cascade,
  participant_profile_id uuid not null references public.profiles(id) on delete cascade,
  participant_role text not null check (participant_role in ('debtor', 'creditor', 'mediator')),
  consented boolean not null,
  consent_version text not null,
  consented_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (appointment_id, participant_profile_id, consent_version)
);

create table public.meeting_artifacts (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.mediation_appointments(id) on delete cascade,
  artifact_type text not null check (artifact_type in ('recording', 'native_transcript', 'manual_transcript')),
  provider text not null default 'google_meet',
  external_name text,
  drive_file_id text,
  source_uri text,
  status text not null default 'discovered' check (status in ('discovered', 'downloading', 'copied', 'processed', 'failed', 'deleted')),
  metadata jsonb not null default '{}'::jsonb,
  last_error text,
  discovered_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (appointment_id, artifact_type, external_name)
);

create table public.meeting_transcripts (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.mediation_appointments(id) on delete cascade,
  artifact_id uuid references public.meeting_artifacts(id) on delete set null,
  status text not null default 'processing' check (status in ('processing', 'ready', 'failed', 'expired')),
  language_code text not null default 'th-TH',
  source text not null default 'google_speech_v2' check (source in ('google_speech_v2', 'google_meet', 'manual')),
  raw_text text,
  private_storage_path text,
  average_confidence numeric(5,4) check (average_confidence is null or average_confidence between 0 and 1),
  retention_until timestamptz not null default (now() + interval '180 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meeting_transcript_segments (
  id uuid primary key default gen_random_uuid(),
  transcript_id uuid not null references public.meeting_transcripts(id) on delete cascade,
  sequence integer not null check (sequence >= 0),
  start_offset_ms bigint not null default 0 check (start_offset_ms >= 0),
  end_offset_ms bigint not null default 0 check (end_offset_ms >= start_offset_ms),
  speaker_label text not null,
  verified_participant_profile_id uuid references public.profiles(id) on delete set null,
  text text not null,
  confidence numeric(5,4) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now(),
  unique (transcript_id, sequence)
);

create table public.meeting_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.mediation_appointments(id) on delete cascade,
  job_type text not null check (job_type in ('artifact_poll', 'transcribe', 'summarize', 'retention_cleanup')),
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'manual_required')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  payload jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  last_error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null unique references public.mediation_appointments(id) on delete cascade,
  case_id uuid not null references public.cases(id) on delete cascade,
  current_version integer not null default 0 check (current_version >= 0),
  status text not null default 'draft' check (status in ('draft', 'approved')),
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meeting_minute_versions (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references public.meeting_minutes(id) on delete cascade,
  version integer not null check (version > 0),
  meeting_datetime text,
  verified_attendees jsonb not null default '[]'::jsonb,
  objective text not null default '',
  key_points jsonb not null default '[]'::jsonb,
  party_positions jsonb not null default '[]'::jsonb,
  monetary_proposals jsonb not null default '[]'::jsonb,
  confirmed_agreements jsonb not null default '[]'::jsonb,
  unresolved_issues jsonb not null default '[]'::jsonb,
  action_items jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  low_confidence_items jsonb not null default '[]'::jsonb,
  source_segment_ids jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'superseded')),
  created_by uuid references public.profiles(id) on delete set null,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (minutes_id, version)
);

create index case_documents_case_idx on public.case_documents(case_id);
create index case_ai_messages_case_idx on public.case_ai_messages(case_id, sequence);
create index case_ai_assessments_case_idx on public.case_ai_assessments(case_id, version desc);
create index ai_processing_jobs_due_idx on public.ai_processing_jobs(status, available_at);
create index appointment_consents_appointment_idx on public.appointment_recording_consents(appointment_id);
create index meeting_artifacts_appointment_idx on public.meeting_artifacts(appointment_id);
create index meeting_transcripts_appointment_idx on public.meeting_transcripts(appointment_id);
create index meeting_segments_transcript_idx on public.meeting_transcript_segments(transcript_id, sequence);
create index meeting_processing_jobs_due_idx on public.meeting_processing_jobs(status, next_attempt_at);
create index meeting_minute_versions_minutes_idx on public.meeting_minute_versions(minutes_id, version desc);

create or replace function public.protect_approved_meeting_minute_version()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  if old.status in ('approved', 'superseded') and (
    new.meeting_datetime is distinct from old.meeting_datetime
    or new.verified_attendees is distinct from old.verified_attendees
    or new.objective is distinct from old.objective
    or new.key_points is distinct from old.key_points
    or new.party_positions is distinct from old.party_positions
    or new.monetary_proposals is distinct from old.monetary_proposals
    or new.confirmed_agreements is distinct from old.confirmed_agreements
    or new.unresolved_issues is distinct from old.unresolved_issues
    or new.action_items is distinct from old.action_items
    or new.next_steps is distinct from old.next_steps
    or new.low_confidence_items is distinct from old.low_confidence_items
    or new.source_segment_ids is distinct from old.source_segment_ids
  ) then
    raise exception 'approved meeting minute versions are immutable';
  end if;
  return new;
end $$;

create trigger protect_approved_meeting_minute_version
before update on public.meeting_minute_versions
for each row execute function public.protect_approved_meeting_minute_version();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'case_documents', 'case_ai_sessions', 'ai_rate_policies', 'ai_processing_jobs',
    'appointment_recording_consents', 'meeting_transcripts', 'meeting_processing_jobs', 'meeting_minutes'
  ] loop
    execute format('drop trigger if exists %I on public.%I', 'set_' || table_name || '_updated_at', table_name);
    execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_' || table_name || '_updated_at', table_name);
  end loop;
end $$;

create or replace function public.can_access_case(target_case_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.cases c
    where c.id = target_case_id and (
      c.debtor_user_id = (select auth.uid())
      or c.assigned_mediator_id = (select auth.uid())
      or public.is_admin()
      or public.is_creditor_org_officer(c.creditor_organization_id)
    )
  )
$$;

create or replace function public.can_staff_case(target_case_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.cases c
    where c.id = target_case_id and (
      c.assigned_mediator_id = (select auth.uid())
      or public.is_admin()
      or public.is_creditor_org_officer(c.creditor_organization_id)
    )
  )
$$;

create or replace function public.can_access_appointment(target_appointment_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.mediation_appointments ma
    left join public.mediator_profiles mp on mp.id = ma.mediator_id
    where ma.id = target_appointment_id and (
      ma.debtor_user_id = (select auth.uid())
      or ma.creditor_officer_user_id = (select auth.uid())
      or public.is_creditor_org_officer(ma.creditor_organization_id)
      or mp.user_id = (select auth.uid())
      or public.is_admin()
    )
  )
$$;

create or replace function public.can_staff_appointment(target_appointment_id uuid)
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (
    select 1 from public.mediation_appointments ma
    left join public.mediator_profiles mp on mp.id = ma.mediator_id
    where ma.id = target_appointment_id and (mp.user_id = (select auth.uid()) or public.is_admin())
  )
$$;

revoke all on function public.can_access_case(uuid) from public;
revoke all on function public.can_staff_case(uuid) from public;
revoke all on function public.can_access_appointment(uuid) from public;
revoke all on function public.can_staff_appointment(uuid) from public;
grant execute on function public.can_access_case(uuid) to authenticated;
grant execute on function public.can_staff_case(uuid) to authenticated;
grant execute on function public.can_access_appointment(uuid) to authenticated;
grant execute on function public.can_staff_appointment(uuid) to authenticated;

alter table public.case_documents enable row level security;
alter table public.case_ai_sessions enable row level security;
alter table public.case_ai_messages enable row level security;
alter table public.case_ai_assessments enable row level security;
alter table public.case_payment_plans enable row level security;
alter table public.ai_rate_policies enable row level security;
alter table public.ai_processing_jobs enable row level security;
alter table public.appointment_recording_consents enable row level security;
alter table public.meeting_artifacts enable row level security;
alter table public.meeting_transcripts enable row level security;
alter table public.meeting_transcript_segments enable row level security;
alter table public.meeting_processing_jobs enable row level security;
alter table public.meeting_minutes enable row level security;
alter table public.meeting_minute_versions enable row level security;

create policy case_documents_participants_select on public.case_documents for select to authenticated
  using (public.can_access_case(case_id));
create policy case_documents_debtor_insert on public.case_documents for insert to authenticated
  with check (uploaded_by = (select auth.uid()) and exists (select 1 from public.cases c where c.id = case_id and c.debtor_user_id = (select auth.uid())));
create policy case_documents_debtor_update on public.case_documents for update to authenticated
  using (exists (select 1 from public.cases c where c.id = case_id and c.debtor_user_id = (select auth.uid()) and c.status in ('draft', 'needs_more_info')))
  with check (exists (select 1 from public.cases c where c.id = case_id and c.debtor_user_id = (select auth.uid()) and c.status in ('draft', 'needs_more_info')));

create policy case_ai_sessions_participants_select on public.case_ai_sessions for select to authenticated
  using (public.can_access_case(case_id));
create policy case_ai_messages_owner_staff_select on public.case_ai_messages for select to authenticated
  using (public.can_access_case(case_id));

-- Deterministic risk score is intentionally staff-only. Debtors receive the
-- duplicated safe summary/strength fields from case_ai_sessions instead.
create policy case_ai_assessments_staff_select on public.case_ai_assessments for select to authenticated
  using (public.can_staff_case(case_id));
create policy case_ai_assessments_admin_update on public.case_ai_assessments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy case_payment_plans_participants_select on public.case_payment_plans for select to authenticated
  using (public.can_access_case(case_id));
create policy ai_rate_policies_authenticated_select on public.ai_rate_policies for select to authenticated using (active = true or public.is_admin());
create policy ai_rate_policies_admin_write on public.ai_rate_policies for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy ai_processing_jobs_participant_select on public.ai_processing_jobs for select to authenticated using (public.can_access_case(case_id));

create policy appointment_consents_parties_select on public.appointment_recording_consents for select to authenticated
  using (public.can_access_appointment(appointment_id));
create policy appointment_consents_self_insert on public.appointment_recording_consents for insert to authenticated
  with check (
    participant_profile_id = (select auth.uid())
    and participant_role = case public.current_app_role() when 'debtor' then 'debtor' when 'creditor' then 'creditor' when 'mediator' then 'mediator' else '' end
    and public.can_access_appointment(appointment_id)
  );
create policy appointment_consents_self_update on public.appointment_recording_consents for update to authenticated
  using (participant_profile_id = (select auth.uid())) with check (
    participant_profile_id = (select auth.uid())
    and participant_role = case public.current_app_role() when 'debtor' then 'debtor' when 'creditor' then 'creditor' when 'mediator' then 'mediator' else '' end
    and public.can_access_appointment(appointment_id)
  );

create policy meeting_artifacts_staff_only on public.meeting_artifacts for select to authenticated using (public.can_staff_appointment(appointment_id));
create policy meeting_transcripts_staff_only on public.meeting_transcripts for select to authenticated using (public.can_staff_appointment(appointment_id));
create policy meeting_segments_staff_only on public.meeting_transcript_segments for select to authenticated
  using (exists (select 1 from public.meeting_transcripts mt where mt.id = transcript_id and public.can_staff_appointment(mt.appointment_id)));
create policy meeting_jobs_staff_only on public.meeting_processing_jobs for select to authenticated using (public.can_staff_appointment(appointment_id));

create policy meeting_minutes_staff_or_approved_party on public.meeting_minutes for select to authenticated
  using (public.can_staff_appointment(appointment_id) or (status = 'approved' and public.can_access_appointment(appointment_id)));
create policy meeting_minutes_staff_write on public.meeting_minutes for all to authenticated
  using (public.can_staff_appointment(appointment_id)) with check (public.can_staff_appointment(appointment_id));
create policy meeting_minute_versions_staff_or_approved_party on public.meeting_minute_versions for select to authenticated
  using (exists (
    select 1 from public.meeting_minutes mm where mm.id = minutes_id
      and (public.can_staff_appointment(mm.appointment_id) or (meeting_minute_versions.status = 'approved' and public.can_access_appointment(mm.appointment_id)))
  ));
create policy meeting_minute_versions_staff_write on public.meeting_minute_versions for all to authenticated
  using (exists (select 1 from public.meeting_minutes mm where mm.id = minutes_id and public.can_staff_appointment(mm.appointment_id)))
  with check (exists (select 1 from public.meeting_minutes mm where mm.id = minutes_id and public.can_staff_appointment(mm.appointment_id)));

grant select, insert, update on public.case_documents, public.case_ai_sessions, public.case_ai_messages,
  public.case_ai_assessments, public.case_payment_plans, public.ai_rate_policies, public.ai_processing_jobs,
  public.appointment_recording_consents, public.meeting_artifacts, public.meeting_transcripts,
  public.meeting_transcript_segments, public.meeting_processing_jobs, public.meeting_minutes,
  public.meeting_minute_versions to authenticated;

comment on table public.meeting_transcripts is 'Raw transcript, private to admin and assigned mediator; default retention is 180 days.';
comment on table public.meeting_minute_versions is 'Immutable, versioned meeting minutes. Parties can read approved versions only.';
