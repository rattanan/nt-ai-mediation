# Appointment Scheduling Manual Testing

## Preconditions

- Apply `supabase/migrations/20260704103000_add_appointment_scheduling.sql`.
- Use approved debtor, creditor officer, mediator, and admin accounts.
- Ensure a debtor case has creditor accepted status and an approved selected mediator.

## Scenarios

1. Approved mediator creates available slots
   - Login as mediator.
   - Open `/mediator`.
   - Add one one-off slot and one recurring weekly slot.
   - Edit start/end time and max cases.
   - Disable one slot and confirm it no longer appears for debtor booking.

2. Debtor selects mediator and books slot
   - Login as debtor.
   - Open a creditor accepted case.
   - Select an approved mediator.
   - Confirm redirect to `/debtor/cases/[id]/appointments/new`.
   - Select an available slot and submit.
   - Confirm appointment detail shows status `รอยืนยันนัดหมาย`.
   - Confirm case status changes to `กำลังนัดหมาย`.

3. Creditor confirms appointment
   - Login as creditor officer for the case organization.
   - Open `/creditor`.
   - Confirm appointment appears in the confirmation queue.
   - Open case detail and click `ยืนยันนัดหมาย`.
   - Confirm creditor participant status is confirmed.

4. Mediator confirms appointment and adds meeting URL
   - Login as mediator.
   - Open `/mediator`.
   - Open pending appointment.
   - Confirm appointment and paste a Zoom, Google Meet, or Teams URL.
   - Confirm provider is inferred and Meeting URL is visible.
   - Try an invalid URL and confirm validation error.

5. Debtor sees meeting link
   - Login as debtor.
   - Open debtor dashboard or appointment detail.
   - Confirm upcoming appointment card shows meeting link after mediator/admin added it.

6. Mediator marks appointment completed
   - Login as mediator.
   - Open confirmed appointment detail.
   - Click `เสร็จสิ้น`.
   - Confirm appointment status becomes completed.

7. Creditor requests reschedule
   - Login as creditor officer.
   - Open case detail with an appointment.
   - Enter reason and click `ขอเลื่อนนัด`.
   - Confirm status becomes `ขอเลื่อนนัด` and history includes the note.

8. Admin views all appointments
   - Login as admin.
   - Open `/admin/appointments`.
   - Filter by status/date.
   - Update meeting URL.
   - Force reschedule and cancel an appointment with a reason.
