import "server-only";

import type { AppointmentStatus } from "@/types/database";

type AppointmentNotificationPayload = {
  appointmentId: string;
  caseId: string;
  status?: AppointmentStatus;
};

export async function notifyAppointmentRequested(payload: AppointmentNotificationPayload) {
  // TODO: Wire to the NT AI Mediation email service.
  console.info("appointment_requested", payload);
}

export async function notifyAppointmentConfirmed(payload: AppointmentNotificationPayload) {
  // TODO: Send confirmation email to debtor, creditor officer, and mediator.
  console.info("appointment_confirmed", payload);
}

export async function notifyRescheduleRequested(payload: AppointmentNotificationPayload) {
  // TODO: Send reschedule request email with the actor note.
  console.info("appointment_reschedule_requested", payload);
}

export async function notifyAppointmentCancelled(payload: AppointmentNotificationPayload) {
  // TODO: Send cancellation email to all appointment participants.
  console.info("appointment_cancelled", payload);
}

export async function notifyAppointmentReminder(payload: AppointmentNotificationPayload) {
  // TODO: Schedule reminder email before the appointment date/time.
  console.info("appointment_reminder", payload);
}
