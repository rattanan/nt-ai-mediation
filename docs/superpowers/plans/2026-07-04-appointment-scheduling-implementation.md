# Appointment Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the case-centric appointment scheduling and online mediation meeting flow after debtor mediator selection.

**Architecture:** Add appointment tables with RLS as the persistence boundary, then layer server-only appointment helpers and Server Actions over them. UI stays in the current App Router structure: debtor case pages handle booking, creditor/mediator/admin dashboards show queues, and shared appointment components keep status cards, slot picking, meeting URL forms, and history consistent.

**Tech Stack:** Next.js 16 App Router, React 19 Server Actions, Supabase Postgres/RLS, TypeScript, existing NT yellow/white Tailwind styling.

---

## File Structure

- Create `supabase/migrations/20260704100000_add_appointment_scheduling.sql`: tables, constraints, triggers, RLS policies, helper indexes.
- Modify `src/types/database.ts`: appointment status/type/provider unions and table types.
- Create `src/lib/appointments.ts`: labels, slot generation, role-scoped queries, URL/provider helpers.
- Create `src/lib/appointment-notifications.ts`: email notification placeholder functions.
- Create `src/components/appointments/appointment-status-badge.tsx`: Thai appointment status badges.
- Create `src/components/appointments/appointment-summary-card.tsx`: compact dashboard/detail card.
- Create `src/components/appointments/appointment-history-list.tsx`: status history renderer.
- Create `src/components/appointments/slot-picker.tsx`: calendar-like debtor slot picker.
- Create `src/components/appointments/meeting-url-form.tsx`: mediator/admin meeting URL form.
- Create `src/components/appointments/availability-slot-form.tsx`: mediator availability creation form.
- Create `src/components/appointments/availability-slot-list.tsx`: mediator availability management list.
- Create `src/app/debtor/cases/[id]/appointments/actions.ts`: debtor booking Server Action.
- Create `src/app/debtor/cases/[id]/appointments/new/page.tsx`: debtor booking page.
- Modify `src/app/debtor/cases/[id]/mediator/actions.ts`: redirect to booking after mediator selection.
- Modify `src/app/debtor/cases/[id]/page.tsx`: appointment card and meeting link.
- Modify `src/app/debtor/page.tsx`: upcoming appointment card.
- Create `src/app/creditor/appointments/actions.ts`: creditor confirm/reschedule actions.
- Modify `src/app/creditor/page.tsx`: appointment queue and upcoming appointment sections.
- Modify `src/app/creditor/cases/[id]/page.tsx`: appointment card on case detail.
- Create `src/app/mediator/appointments/actions.ts`: mediator confirm/reschedule/meeting/completion actions.
- Create `src/app/mediator/availability/actions.ts`: mediator availability create/update/disable actions.
- Create `src/app/mediator/availability/page.tsx`: availability management page.
- Modify `src/app/mediator/page.tsx`: appointment queue/today/upcoming sections.
- Create `src/app/admin/appointments/actions.ts`: admin cancel/reschedule/meeting URL actions.
- Modify `src/app/admin/appointments/page.tsx`: real admin appointment list and filters.
- Create `docs/manual-testing/appointment-scheduling.md`: scenario guide.

## Task 1: Database Migration and Types

**Files:**
- Create: `supabase/migrations/20260704100000_add_appointment_scheduling.sql`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add SQL migration**

Create the migration with:

```sql
create table if not exists public.mediator_availability_slots (
  id uuid primary key default gen_random_uuid(),
  mediator_profile_id uuid not null references public.mediator_profiles(id) on delete cascade,
  slot_date date,
  day_of_week int,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Bangkok',
  meeting_type text not null default 'online',
  is_recurring boolean not null default false,
  recurrence_starts_on date,
  recurrence_ends_on date,
  max_cases_per_day int not null default 4,
  max_cases_per_month int not null default 20,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mediator_availability_slots_time_check check (end_time > start_time),
  constraint mediator_availability_slots_day_check check (day_of_week is null or day_of_week between 0 and 6),
  constraint mediator_availability_slots_meeting_type_check check (meeting_type in ('online', 'onsite', 'hybrid')),
  constraint mediator_availability_slots_shape_check check (
    (is_recurring = true and day_of_week is not null and recurrence_starts_on is not null)
    or (is_recurring = false and slot_date is not null)
  )
);

create table if not exists public.mediation_appointments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.cases(id) on delete cascade,
  mediator_id uuid not null references public.mediator_profiles(id) on delete restrict,
  debtor_user_id uuid not null references public.profiles(id) on delete cascade,
  creditor_organization_id uuid references public.creditor_organizations(id) on delete set null,
  creditor_officer_user_id uuid references public.profiles(id) on delete set null,
  appointment_date date not null,
  start_time time not null,
  end_time time not null,
  timezone text not null default 'Asia/Bangkok',
  meeting_type text not null default 'online',
  meeting_url text,
  meeting_provider text not null default 'manual_link',
  status text not null default 'requested',
  requested_by uuid references public.profiles(id) on delete set null,
  confirmed_by_mediator_at timestamptz,
  confirmed_by_creditor_at timestamptz,
  confirmed_by_debtor_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint mediation_appointments_time_check check (end_time > start_time),
  constraint mediation_appointments_status_check check (status in ('requested', 'pending_confirmation', 'confirmed', 'reschedule_requested', 'completed', 'cancelled', 'no_show')),
  constraint mediation_appointments_meeting_type_check check (meeting_type in ('online', 'onsite', 'hybrid')),
  constraint mediation_appointments_provider_check check (meeting_provider in ('manual_link', 'google_meet', 'zoom', 'other'))
);

create unique index if not exists mediation_appointments_one_active_case_idx
on public.mediation_appointments(case_id)
where status in ('requested', 'pending_confirmation', 'confirmed', 'reschedule_requested');

create index if not exists mediation_appointments_mediator_date_idx
on public.mediation_appointments(mediator_id, appointment_date, start_time);

create table if not exists public.appointment_participants (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.mediation_appointments(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  organization_id uuid references public.creditor_organizations(id) on delete set null,
  role text not null,
  confirmation_status text not null default 'pending',
  confirmed_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appointment_participants_role_check check (role in ('debtor', 'creditor_officer', 'mediator', 'admin')),
  constraint appointment_participants_confirmation_check check (confirmation_status in ('pending', 'confirmed', 'reschedule_requested', 'declined'))
);

create table if not exists public.appointment_status_history (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.mediation_appointments(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.profiles(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
```

Also add updated-at triggers and RLS policies using existing `public.is_admin()` and `public.is_creditor_org_officer(uuid)`.

- [ ] **Step 2: Update TypeScript database types**

Add unions:

```ts
export type AppointmentStatus = "requested" | "pending_confirmation" | "confirmed" | "reschedule_requested" | "completed" | "cancelled" | "no_show";
export type AppointmentMeetingType = "online" | "onsite" | "hybrid";
export type AppointmentMeetingProvider = "manual_link" | "google_meet" | "zoom" | "other";
export type AppointmentParticipantRole = "debtor" | "creditor_officer" | "mediator" | "admin";
export type AppointmentParticipantConfirmation = "pending" | "confirmed" | "reschedule_requested" | "declined";
```

Add `mediator_availability_slots`, `mediation_appointments`, `appointment_participants`, and `appointment_status_history` table definitions under `Database["public"]["Tables"]`.

- [ ] **Step 3: Verify types**

Run: `npm run typecheck`

Expected: PASS. If this fails, fix `src/types/database.ts` syntax before moving on.

## Task 2: Appointment Domain Helpers

**Files:**
- Create: `src/lib/appointments.ts`
- Create: `src/lib/appointment-notifications.ts`

- [ ] **Step 1: Create notification placeholders**

Implement exported async functions:

```ts
export async function notifyAppointmentRequested(appointmentId: string) {
  console.info("appointment notification requested", { type: "requested", appointmentId });
}
```

Add separate exported functions for confirmed, reschedule requested, cancelled, and reminder, using the same `console.info` shape with the matching `type` value. Include one short comment near the exports that a real email service should be wired here when one is available.

- [ ] **Step 2: Create labels and URL helpers**

Add status label maps and:

```ts
export function inferMeetingProvider(url: string): AppointmentMeetingProvider {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname.includes("zoom.us")) return "zoom";
  if (hostname.includes("meet.google.com")) return "google_meet";
  return "other";
}

export function normalizeMeetingUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return { url: null, provider: "manual_link" as const };
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Meeting URL must start with http or https");
  }
  return { url: parsed.toString(), provider: inferMeetingProvider(parsed.toString()) };
}
```

- [ ] **Step 3: Create role-scoped query helpers**

Implement:

```ts
export async function getActiveAppointmentForCase(caseId: string) {
  // Return the newest appointment for this case where status is requested, pending_confirmation, confirmed, or reschedule_requested.
}

export async function getAvailableSlotsForCase(caseId: string, debtorUserId: string) {
  // Verify debtor owns the case, load selected mediator, expand active one-off and recurring slots for the next 30 days, remove already-booked times, and return grouped slot view models.
}

export async function getAppointmentsForDebtor(userId: string) {
  // Return appointments where debtor_user_id equals userId, ordered by appointment_date/start_time.
}

export async function getAppointmentsForMediator(mediatorProfileId: string) {
  // Return appointments where mediator_id equals mediatorProfileId, ordered by appointment_date/start_time.
}

export async function getAppointmentsForCreditorOrganization(organizationId?: string | null) {
  // Return an empty list without organizationId, otherwise appointments where creditor_organization_id equals organizationId.
}

export async function getAdminAppointments(filters: { status?: string; date?: string; mediator?: string; creditor?: string }) {
  // Return filtered appointments for admin list; apply exact filters only when values are present.
}
```

Generate recurring occurrences for the next 30 days in TypeScript by expanding active recurring slots and excluding appointments already booked for the same mediator/date/start/end.

## Task 3: Shared Appointment Components

**Files:**
- Create: `src/components/appointments/appointment-status-badge.tsx`
- Create: `src/components/appointments/appointment-summary-card.tsx`
- Create: `src/components/appointments/appointment-history-list.tsx`
- Create: `src/components/appointments/slot-picker.tsx`
- Create: `src/components/appointments/meeting-url-form.tsx`

- [ ] **Step 1: Build `AppointmentStatusBadge`**

Render Thai labels from `appointmentStatusLabels` with `Badge`.

- [ ] **Step 2: Build `AppointmentSummaryCard`**

Props include appointment row and optional `href`. Show date, time, status, meeting URL button when present, and Thai labels.

- [ ] **Step 3: Build `SlotPicker`**

Render grouped slot buttons:

```tsx
<form action={action} className="space-y-5">
  <input type="hidden" name="slot_id" value={selectedSlotId} />
  <button type="submit" disabled={!selectedSlotId}>ยืนยันเวลานัดหมาย</button>
</form>
```

Use client state for selected slot. Keep stable button dimensions and mobile single-column layout.

- [ ] **Step 4: Build `MeetingUrlForm`**

Render URL input and submit button. Server action validates and stores URL.

- [ ] **Step 5: Build `AppointmentHistoryList`**

Render status history entries newest-first with Thai date/time formatting.

## Task 4: Debtor Booking Flow

**Files:**
- Create: `src/app/debtor/cases/[id]/appointments/actions.ts`
- Create: `src/app/debtor/cases/[id]/appointments/new/page.tsx`
- Modify: `src/app/debtor/cases/[id]/mediator/actions.ts`
- Modify: `src/app/debtor/cases/[id]/page.tsx`
- Modify: `src/app/debtor/page.tsx`

- [ ] **Step 1: Create debtor booking action**

`bookAppointment(caseId: string, formData: FormData)` must:

- `requireRole("debtor")`
- load case and selected mediator
- validate slot id belongs to selected mediator and is active
- insert `mediation_appointments` with `status: "pending_confirmation"`
- insert debtor, mediator, and creditor participant rows
- insert appointment status history
- update case status to `appointment_scheduling`
- insert case status history
- call `notifyAppointmentRequested`
- redirect to case detail with success

- [ ] **Step 2: Create booking page**

Use `getAvailableSlotsForCase` and `SlotPicker`. Empty state says no available slots and links back to case.

- [ ] **Step 3: Redirect after mediator selection**

Change select mediator redirect to `/debtor/cases/${caseId}/appointments/new?success=${encodeURIComponent("เลือกผู้ไกล่เกลี่ยแล้ว กรุณาเลือกเวลานัดหมาย")}`.

- [ ] **Step 4: Add appointment card to case detail**

Show current appointment if active. If `mediator_selected` and no active appointment, show CTA to booking page.

- [ ] **Step 5: Add debtor dashboard upcoming card**

Show next active appointment and meeting link if available.

## Task 5: Creditor Confirmation Flow

**Files:**
- Create: `src/app/creditor/appointments/actions.ts`
- Modify: `src/app/creditor/page.tsx`
- Modify: `src/app/creditor/cases/[id]/page.tsx`

- [ ] **Step 1: Add creditor actions**

Implement `confirmCreditorAppointment` and `requestCreditorAppointmentReschedule`.

Confirmation sets participant status to `confirmed`, sets `confirmed_by_creditor_at`, and if mediator/debtor confirmations are complete, sets appointment `confirmed` and case `scheduled`.

- [ ] **Step 2: Add creditor dashboard queue**

Show pending appointments for the officer organization, with confirm and reschedule controls.

- [ ] **Step 3: Add appointment card to creditor case detail**

Show status, date/time, notes, meeting URL if confirmed.

## Task 6: Mediator Availability and Appointment Flow

**Files:**
- Create: `src/app/mediator/availability/actions.ts`
- Create: `src/app/mediator/availability/page.tsx`
- Create: `src/app/mediator/appointments/actions.ts`
- Create: `src/components/appointments/availability-slot-form.tsx`
- Create: `src/components/appointments/availability-slot-list.tsx`
- Modify: `src/app/mediator/page.tsx`

- [ ] **Step 1: Add availability actions**

Implement `createAvailabilitySlot`, `updateAvailabilitySlot`, and `disableAvailabilitySlot`. Validate mediator profile ownership and approved status.

- [ ] **Step 2: Add availability page**

Render one-off and recurring slot form, existing slot list, edit/disable controls.

- [ ] **Step 3: Add mediator appointment actions**

Implement confirm, request reschedule, update meeting URL, mark completed, mark no-show.

- [ ] **Step 4: Update mediator dashboard**

Add today appointments, upcoming appointments, pending confirmation, and availability management link.

## Task 7: Admin Appointments

**Files:**
- Create: `src/app/admin/appointments/actions.ts`
- Modify: `src/app/admin/appointments/page.tsx`

- [ ] **Step 1: Replace placeholder page**

Render filter form for status/date/mediator/creditor and table of all appointments.

- [ ] **Step 2: Add admin actions**

Implement cancel, request reschedule, and update meeting URL. Admin actions insert appointment history and notify when needed.

## Task 8: Manual Testing Guide and Verification

**Files:**
- Create: `docs/manual-testing/appointment-scheduling.md`

- [ ] **Step 1: Add manual testing guide**

Include the 8 requested user scenarios plus expected status changes and visible UI locations.

- [ ] **Step 2: Run verification**

Run:

```bash
npm run typecheck
npm run lint
npm run build
```

Expected: all pass.

## Self-Review

- Spec coverage: database, RLS, types, components, actions, dashboards, notifications, meeting URL, and manual test guide are represented.
- Placeholder scan: notification placeholders are explicit scope and not hidden work.
- Type consistency: appointment status/type/provider names match the approved spec.
