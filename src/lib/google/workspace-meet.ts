import "server-only";

import { getGoogleAccessToken } from "@/lib/google/auth";
import { googleCalendarEventId, isGoogleMeetEligible, resolveParticipantEmail } from "@/lib/google/calendar-event";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type Appointment = Database["public"]["Tables"]["mediation_appointments"]["Row"];

const calendarScope = "https://www.googleapis.com/auth/calendar.events";
const meetScope = "https://www.googleapis.com/auth/meetings.space.created";

function organizer() {
  const email =
    process.env.GOOGLE_CALENDAR_ORGANIZER_EMAIL ||
    process.env.GOOGLE_WORKSPACE_ORGANIZER_EMAIL;
  if (!email) throw new Error("GOOGLE_CALENDAR_ORGANIZER_EMAIL is not configured");
  return email;
}

async function googleRequest<T>(url: string, init: RequestInit, scopes: string[] = [calendarScope]) {
  const token = await getGoogleAccessToken(scopes, organizer());
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init.headers }, cache: "no-store" });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Google Workspace returned ${response.status}: ${detail.slice(0, 300)}`);
  }
  return response.status === 204 ? null as T : await response.json() as T;
}

async function resolveAttendees(appointment: Appointment) {
  const admin = createAdminClient();
  const { data: mediator } = await admin.from("mediator_profiles").select("user_id").eq("id", appointment.mediator_id).single();
  let creditorOfficerQuery = appointment.creditor_organization_id
    ? admin
      .from("creditor_officers")
      .select("user_id, email, first_name, last_name")
      .eq("organization_id", appointment.creditor_organization_id)
      .eq("status", "active")
    : null;
  if (creditorOfficerQuery && appointment.creditor_officer_user_id) {
    creditorOfficerQuery = creditorOfficerQuery.eq("user_id", appointment.creditor_officer_user_id);
  }
  const { data: creditorOfficer } = creditorOfficerQuery
    ? await creditorOfficerQuery.order("created_at", { ascending: true }).limit(1).maybeSingle()
    : { data: null };
  const creditorOfficerUserId = appointment.creditor_officer_user_id ?? creditorOfficer?.user_id ?? null;
  const ids = [appointment.debtor_user_id, creditorOfficerUserId, mediator?.user_id].filter((id): id is string => Boolean(id));
  const { data: profiles } = await admin.from("profiles").select("id, email, full_name").in("id", ids);
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const required = [
    { role: "debtor", id: appointment.debtor_user_id },
    {
      role: "creditor",
      id: creditorOfficerUserId,
      fallbackEmail: creditorOfficer?.user_id === creditorOfficerUserId ? creditorOfficer.email : null,
      fallbackName: creditorOfficer?.user_id === creditorOfficerUserId
        ? `${creditorOfficer.first_name} ${creditorOfficer.last_name}`.trim()
        : null,
    },
    { role: "mediator", id: mediator?.user_id },
  ];
  const missing = required
    .filter((item) => !item.id || !resolveParticipantEmail(byId.get(item.id)?.email, item.fallbackEmail))
    .map((item) => item.role);
  if (missing.length) throw new Error(`Missing participant email: ${missing.join(", ")}`);

  if (!appointment.creditor_officer_user_id && creditorOfficerUserId) {
    await Promise.all([
      admin
        .from("mediation_appointments")
        .update({ creditor_officer_user_id: creditorOfficerUserId })
        .eq("id", appointment.id)
        .is("creditor_officer_user_id", null),
      admin
        .from("appointment_participants")
        .update({ profile_id: creditorOfficerUserId })
        .eq("appointment_id", appointment.id)
        .eq("role", "creditor_officer")
        .is("profile_id", null),
    ]);
  }

  return required.map((item) => ({
    email: resolveParticipantEmail(byId.get(item.id!)?.email, item.fallbackEmail)!,
    displayName: byId.get(item.id!)?.full_name || item.fallbackName || item.role,
  }));
}

function eventBody(appointment: Appointment, attendees: Awaited<ReturnType<typeof resolveAttendees>>) {
  return {
    summary: `ไกล่เกลี่ยหนี้ NT Mediation`,
    description: `นัดหมายในระบบ NT AI Mediation\nAppointment ID: ${appointment.id}`,
    start: { dateTime: `${appointment.appointment_date}T${appointment.start_time}`, timeZone: appointment.timezone },
    end: { dateTime: `${appointment.appointment_date}T${appointment.end_time}`, timeZone: appointment.timezone },
    attendees,
    conferenceData: { createRequest: { requestId: appointment.id, conferenceSolutionKey: { type: "hangoutsMeet" } } },
  };
}

type CalendarEvent = {
  id: string;
  hangoutLink?: string;
  conferenceData?: { conferenceId?: string; entryPoints?: Array<{ entryPointType?: string; uri?: string }> };
};

export async function createGoogleMeetForAppointment(appointmentId: string, actorId: string) {
  const admin = createAdminClient();
  const { data: appointment } = await admin.from("mediation_appointments").select("*").eq("id", appointmentId).single();
  if (!appointment) throw new Error("Appointment not found");
  if (!isGoogleMeetEligible(appointment.meeting_type, appointment.status)) throw new Error("Appointment is not eligible for Google Meet");
  if (appointment.calendar_event_id && appointment.meeting_url) return appointment;

  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || organizer());
  if (appointment.calendar_event_id) {
    const existing = await googleRequest<CalendarEvent>(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(appointment.calendar_event_id)}`, { method: "GET" });
    const existingUrl = existing.hangoutLink || existing.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri || null;
    const existingCode = existing.conferenceData?.conferenceId || existingUrl?.split("/").at(-1) || appointment.meeting_code;
    const { data: refreshed } = await admin.from("mediation_appointments").update({ meeting_url: existingUrl, meeting_code: existingCode, meeting_provider: "google_meet", google_sync_status: existingUrl ? "synced" : "creating", google_sync_error: null }).eq("id", appointment.id).select("*").single();
    return refreshed ?? appointment;
  }
  await admin.from("mediation_appointments").update({ google_sync_status: "creating", google_sync_error: null }).eq("id", appointment.id);
  try {
    const attendees = await resolveAttendees(appointment);
    const event = await googleRequest<CalendarEvent>(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?conferenceDataVersion=1&sendUpdates=all`,
      { method: "POST", body: JSON.stringify({ id: googleCalendarEventId(appointment.id), ...eventBody(appointment, attendees) }) },
    );
    const meetingUrl = event.hangoutLink || event.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri || null;
    const meetingCode = event.conferenceData?.conferenceId || meetingUrl?.split("/").at(-1) || null;
    let meetSpaceName: string | null = null;
    if (meetingCode) {
      try {
        const space = await googleRequest<{ name?: string }>(`https://meet.googleapis.com/v2/spaces/${meetingCode}`, { method: "GET" }, [meetScope]);
        meetSpaceName = space?.name ?? null;
      } catch (spaceError) {
        console.error("Meet space lookup failed", spaceError);
      }
    }
    const { data: updated, error } = await admin.from("mediation_appointments").update({ calendar_event_id: event.id, meet_space_name: meetSpaceName, meeting_code: meetingCode, meeting_url: meetingUrl, meeting_provider: "google_meet", organizer_email: organizer(), google_sync_status: meetingUrl ? "synced" : "creating", meeting_created_by: actorId }).eq("id", appointment.id).select("*").single();
    if (error || !updated) throw error ?? new Error("Could not save Meet identifiers");
    await admin.from("audit_logs").insert({ actor_profile_id: actorId, action: "google_meet.created", entity_table: "mediation_appointments", entity_id: appointment.id, metadata: { calendar_event_id: event.id, attendee_count: attendees.length } as Json });
    await configureMeetAutoRecording(appointment.id).catch((recordingError) => console.error("Meet was created but auto-recording configuration failed", recordingError));
    return updated;
  } catch (error) {
    await admin.from("mediation_appointments").update({ google_sync_status: "failed", google_sync_error: error instanceof Error ? error.message : "Google Meet creation failed" }).eq("id", appointment.id);
    throw error;
  }
}

export async function updateGoogleCalendarEvent(appointmentId: string, actorId: string) {
  const admin = createAdminClient();
  const { data: appointment } = await admin.from("mediation_appointments").select("*").eq("id", appointmentId).single();
  if (!appointment?.calendar_event_id) return;
  const attendees = await resolveAttendees(appointment);
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || organizer());
  await admin.from("mediation_appointments").update({ google_sync_status: "updating" }).eq("id", appointment.id);
  await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(appointment.calendar_event_id)}?conferenceDataVersion=1&sendUpdates=all`, { method: "PATCH", body: JSON.stringify(eventBody(appointment, attendees)) });
  await admin.from("mediation_appointments").update({ google_sync_status: "synced", google_sync_error: null }).eq("id", appointment.id);
  await admin.from("audit_logs").insert({ actor_profile_id: actorId, action: "google_meet.updated", entity_table: "mediation_appointments", entity_id: appointment.id });
}

export async function cancelGoogleCalendarEvent(appointmentId: string, actorId: string) {
  const admin = createAdminClient();
  const { data: appointment } = await admin.from("mediation_appointments").select("calendar_event_id").eq("id", appointmentId).single();
  if (!appointment?.calendar_event_id) return;
  const calendarId = encodeURIComponent(process.env.GOOGLE_CALENDAR_ID || organizer());
  await admin.from("mediation_appointments").update({ google_sync_status: "cancelling" }).eq("id", appointmentId);
  await googleRequest(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${encodeURIComponent(appointment.calendar_event_id)}?sendUpdates=all`, { method: "DELETE" });
  await admin.from("mediation_appointments").update({ google_sync_status: "cancelled", google_sync_error: null }).eq("id", appointmentId);
  await admin.from("audit_logs").insert({ actor_profile_id: actorId, action: "google_meet.cancelled", entity_table: "mediation_appointments", entity_id: appointmentId });
}

export async function configureMeetAutoRecording(appointmentId: string) {
  if (process.env.GOOGLE_MEET_AUTO_RECORDING !== "true") return false;
  const admin = createAdminClient();
  const { data: appointment } = await admin.from("mediation_appointments").select("meet_space_name, meeting_code, debtor_user_id, creditor_officer_user_id, mediator_id, recording_status").eq("id", appointmentId).single();
  const { data: mediator } = appointment ? await admin.from("mediator_profiles").select("user_id").eq("id", appointment.mediator_id).single() : { data: null };
  const expectedProfiles: Record<"debtor" | "creditor" | "mediator", string | null | undefined> = { debtor: appointment?.debtor_user_id, creditor: appointment?.creditor_officer_user_id, mediator: mediator?.user_id };
  const consentVersion = process.env.MEETING_RECORDING_CONSENT_VERSION || "2026-07-13";
  const { data: consents } = await admin.from("appointment_recording_consents").select("participant_profile_id, participant_role, consented, revoked_at").eq("appointment_id", appointmentId).eq("consent_version", consentVersion);
  const accepted = new Set((consents ?? []).filter((item) => item.consented && !item.revoked_at && expectedProfiles[item.participant_role] === item.participant_profile_id).map((item) => item.participant_role));
  const requiredRoles: Array<"debtor" | "creditor" | "mediator"> = ["debtor", "creditor", "mediator"];
  const space = appointment?.meet_space_name || (appointment?.meeting_code ? `spaces/${appointment.meeting_code}` : null);
  if (!requiredRoles.every((role) => accepted.has(role))) {
    const explicitlyDeclined = (consents ?? []).some((item) => expectedProfiles[item.participant_role] === item.participant_profile_id && (!item.consented || item.revoked_at));
    if (space && appointment?.recording_status === "enabled") {
      await googleRequest(`https://meet.googleapis.com/v2/${space}?updateMask=config.artifactConfig.recordingConfig.autoRecordingGeneration`, { method: "PATCH", body: JSON.stringify({ config: { artifactConfig: { recordingConfig: { autoRecordingGeneration: "OFF" } } } }) }, [meetScope]);
    }
    await admin.from("mediation_appointments").update({ recording_status: explicitlyDeclined ? "disabled" : "waiting_consent" }).eq("id", appointmentId);
    return false;
  }
  if (!space) return false;
  await googleRequest(`https://meet.googleapis.com/v2/${space}?updateMask=config.artifactConfig.recordingConfig.autoRecordingGeneration`, { method: "PATCH", body: JSON.stringify({ config: { artifactConfig: { recordingConfig: { autoRecordingGeneration: "ON" } } } }) }, [meetScope]);
  await admin.from("mediation_appointments").update({ recording_status: "enabled" }).eq("id", appointmentId);
  return true;
}
