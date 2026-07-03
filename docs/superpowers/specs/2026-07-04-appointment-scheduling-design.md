# Appointment Scheduling and Online Mediation Design

## Goal

Implement a case-centric appointment scheduling flow for NT AI Digital Mediation Platform. After a debtor selects an approved mediator for a case, the debtor can book an available mediation slot, then the creditor officer and mediator can confirm, reschedule, add meeting information, and complete the appointment.

## Chosen Approach

Use the case-centric booking model. The debtor starts from the existing case detail flow, selects a mediator, then chooses an available slot for that mediator. All actors view the same appointment detail record through role-specific dashboards and queues.

This fits the existing product shape because cases already track `selected_mediator_profile_id`, `assigned_mediator_id`, creditor organization, debtor user, and status transitions. Mediator calendar management becomes the source of available slots, while appointment booking remains tied to the case.

## Scope

This version includes:

- SQL migration for appointment tables, check constraints, indexes, triggers, and RLS policies.
- TypeScript database types for the new appointment tables.
- Server-side appointment data helpers and notification placeholder functions.
- Mediator availability management.
- Debtor booking page after mediator selection.
- Shared appointment detail page per actor where practical.
- Creditor confirmation and reschedule actions.
- Mediator confirmation, meeting URL entry, completion, and no-show actions.
- Admin appointment list with filtering and force cancel/reschedule actions.
- Dashboard cards and queues for debtor, creditor, mediator, and admin.
- Manual meeting URL support for Zoom, Google Meet, Microsoft Teams, and other URLs.
- Manual testing guide.

This version does not integrate Google Meet API, Zoom API, Teams API, or a real email service. It creates fields and function boundaries that allow those integrations later.

## Data Model

### `mediator_availability_slots`

Purpose: stores bookable time slots for approved mediators.

Fields:

- `id uuid primary key`
- `mediator_profile_id uuid not null references public.mediator_profiles(id)`
- `slot_date date`
- `day_of_week int`
- `start_time time not null`
- `end_time time not null`
- `timezone text not null default 'Asia/Bangkok'`
- `meeting_type text not null default 'online'`
- `is_recurring boolean not null default false`
- `recurrence_starts_on date`
- `recurrence_ends_on date`
- `max_cases_per_day int not null default 4`
- `max_cases_per_month int not null default 20`
- `active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rules:

- One-off slots use `slot_date`.
- Weekly recurring slots use `day_of_week`, `is_recurring = true`, and recurrence date range.
- `end_time` must be greater than `start_time`.
- `meeting_type` must be `online`, `onsite`, or `hybrid`.
- Debtors only see active slots from approved mediator profiles.
- Booking logic excludes slots that already have active appointments for the same mediator/date/time.

### `mediation_appointments`

Purpose: stores the primary mediation appointment.

Fields:

- `id uuid primary key`
- `case_id uuid not null references public.cases(id)`
- `mediator_id uuid not null references public.mediator_profiles(id)`
- `debtor_user_id uuid not null references public.profiles(id)`
- `creditor_organization_id uuid references public.creditor_organizations(id)`
- `creditor_officer_user_id uuid references public.profiles(id)`
- `appointment_date date not null`
- `start_time time not null`
- `end_time time not null`
- `timezone text not null default 'Asia/Bangkok'`
- `meeting_type text not null default 'online'`
- `meeting_url text`
- `meeting_provider text not null default 'manual_link'`
- `status text not null default 'requested'`
- `requested_by uuid references public.profiles(id)`
- `confirmed_by_mediator_at timestamptz`
- `confirmed_by_creditor_at timestamptz`
- `confirmed_by_debtor_at timestamptz`
- `cancellation_reason text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Status values:

- `requested`
- `pending_confirmation`
- `confirmed`
- `reschedule_requested`
- `completed`
- `cancelled`
- `no_show`

Meeting types:

- `online`
- `onsite`
- `hybrid`

Meeting providers:

- `manual_link`
- `google_meet`
- `zoom`
- `other`

Rules:

- One active appointment per case at a time. Active means `requested`, `pending_confirmation`, `confirmed`, or `reschedule_requested`.
- `end_time` must be greater than `start_time`.
- `meeting_url`, when present, must be a valid `http` or `https` URL in server action validation.
- Provider is inferred from URL where possible, or stored as manual/other.

### `appointment_participants`

Purpose: stores participant-level confirmation and notes.

Fields:

- `id uuid primary key`
- `appointment_id uuid not null references public.mediation_appointments(id)`
- `user_id uuid references public.profiles(id)`
- `organization_id uuid references public.creditor_organizations(id)`
- `role text not null`
- `confirmation_status text not null default 'pending'`
- `confirmed_at timestamptz`
- `note text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Roles:

- `debtor`
- `creditor_officer`
- `mediator`
- `admin`

Confirmation status values:

- `pending`
- `confirmed`
- `reschedule_requested`
- `declined`

### `appointment_status_history`

Purpose: append-only status audit trail.

Fields:

- `id uuid primary key`
- `appointment_id uuid not null references public.mediation_appointments(id)`
- `from_status text`
- `to_status text not null`
- `changed_by uuid references public.profiles(id)`
- `note text`
- `created_at timestamptz not null default now()`

## RLS Design

All appointment tables use RLS.

Policies:

- Debtor can select appointments where `debtor_user_id = auth.uid()`.
- Debtor can insert a booking only for a case where `cases.debtor_user_id = auth.uid()` and selected mediator matches the booked mediator.
- Creditor officer can select/update appointments where `public.is_creditor_org_officer(creditor_organization_id)` is true.
- Mediator can select/update appointments where the appointment mediator profile belongs to `auth.uid()`.
- Admin can select/insert/update/delete all appointment-related rows.
- Public and anon users have no appointment access.
- Availability slots can be managed by the owning mediator or admin.
- Debtors can select active availability slots for approved mediators only.

For write policies, use `TO authenticated` with ownership predicates, and include both `USING` and `WITH CHECK` for updates.

## Application Architecture

### Data helpers

Create `src/lib/appointments.ts` with:

- appointment labels and badge variants
- `getAvailableSlotsForCase(caseId, debtorUserId)`
- `getAppointmentForRole(appointmentId, profile)`
- `getAppointmentsForDebtor(userId)`
- `getAppointmentsForCreditorOrganization(organizationId)`
- `getAppointmentsForMediator(mediatorProfileId)`
- `getAdminAppointments(filters)`
- URL validation/provider inference helpers

### Notifications

Create `src/lib/appointment-notifications.ts` with placeholder functions:

- `notifyAppointmentRequested(appointmentId)`
- `notifyAppointmentConfirmed(appointmentId)`
- `notifyRescheduleRequested(appointmentId)`
- `notifyAppointmentCancelled(appointmentId)`
- `notifyAppointmentReminder(appointmentId)`

Each function logs structured data and includes a short code comment that real email delivery should be wired when an email service is added.

### Debtor flow

Existing mediator selection action currently sets case status to `mediator_selected` and redirects to the case detail. Change the redirect to the debtor appointment booking page:

- `/debtor/cases/[id]/appointments/new`

Booking page:

- Shows case number, creditor, mediator, and available slots.
- Uses a calendar-like responsive grid grouped by date.
- Debtor selects a slot and submits.
- Server action creates `mediation_appointments`, participant rows, status history, updates case to `appointment_scheduling`, and writes case status history.

Case detail:

- Shows appointment card when an appointment exists.
- Shows meeting link when appointment is confirmed and URL exists.
- Shows booking CTA when status is `mediator_selected` and no active appointment exists.

### Creditor flow

Creditor dashboard:

- Add appointment confirmation queue count.
- Add upcoming appointment list.

Creditor appointment actions:

- Confirm appointment.
- Request reschedule with note.

Creditor can access appointment details for appointments tied to its organization.

### Mediator flow

Mediator dashboard:

- Add today appointments.
- Add upcoming appointments.
- Add pending confirmation count.
- Link to availability management.

Mediator availability page:

- Create one-off slots.
- Create recurring weekly slots.
- Edit/disable slots.
- Set maximum cases per day/month on slots.

Mediator appointment actions:

- Confirm appointment.
- Request reschedule with note.
- Add or update meeting URL.
- Mark completed.
- Mark no-show.

### Admin flow

Admin appointments page:

- Replace placeholder with all appointments list.
- Filters: status, date, mediator, creditor.
- Links to appointment detail.
- Admin can cancel or mark reschedule requested with note.
- Admin can edit meeting URL.

## UI Design

Use the existing NT yellow/white theme.

Components:

- `AppointmentStatusBadge`
- `SlotPicker`
- `AppointmentSummaryCard`
- `MeetingUrlForm`
- `AppointmentHistoryList`
- `AvailabilitySlotForm`
- `AvailabilitySlotList`

Thai labels are used across user-facing UI:

- รอนัดหมาย
- รอยืนยัน
- ยืนยันแล้ว
- ขอเปลี่ยนเวลา
- เสร็จสิ้น
- ยกเลิก
- ไม่เข้าร่วม

The slot picker is a compact calendar-like grid:

- Date heading
- Time buttons
- Disabled unavailable slots
- Mobile uses single column date groups
- Desktop uses multi-column date groups

## Error Handling

Server actions validate:

- User role and ownership.
- Case has selected approved mediator.
- Slot is active and belongs to mediator.
- Slot time is not already booked.
- Meeting URL is valid when provided.
- Status transition is allowed.

On failure:

- Return or redirect with Thai error messages matching existing patterns.
- Log Supabase errors server-side.
- Do not leak appointment data across roles.

## Status Transitions

Appointment:

- `requested` → `pending_confirmation`
- `pending_confirmation` → `confirmed`
- `pending_confirmation` → `reschedule_requested`
- `confirmed` → `completed`
- `confirmed` → `no_show`
- any active status → `cancelled` by admin or authorized owner action

Case:

- `mediator_selected` → `appointment_scheduling` when debtor books a slot
- `appointment_scheduling` → `scheduled` when required confirmations are complete
- `scheduled` → `in_mediation` is reserved for future live-session flow

## Manual Testing Guide

1. Approved mediator creates available one-off slot.
2. Approved mediator creates recurring weekly slot.
3. Debtor selects an approved mediator and is redirected to appointment booking.
4. Debtor books a slot and case status becomes `appointment_scheduling`.
5. Creditor dashboard shows appointment confirmation queue.
6. Creditor confirms appointment.
7. Mediator confirms appointment.
8. Appointment becomes confirmed when required confirmations are complete.
9. Mediator adds a Zoom/Google Meet/Teams URL.
10. Debtor sees meeting link on dashboard/case/appointment detail.
11. Mediator marks appointment completed.
12. Creditor requests reschedule on another appointment.
13. Admin views appointments and filters by status/date/mediator/creditor.
14. Admin cancels an appointment with a reason.

## Open Implementation Notes

- Current app already has a legacy `mediation_sessions` table. This feature will use the new appointment tables and only update existing case statuses.
- `creditor_officer_user_id` can be null at booking time. It is set when a creditor officer confirms or interacts with the appointment.
- Real email delivery is intentionally outside this version; placeholders keep call sites ready.
