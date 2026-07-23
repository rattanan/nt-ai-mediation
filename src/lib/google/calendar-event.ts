export function googleCalendarEventId(appointmentId: string) {
  return `ntm${appointmentId.replaceAll("-", "")}`;
}

export function isGoogleMeetEligible(meetingType: string, status: string) {
  return ["online", "hybrid"].includes(meetingType) && !["cancelled", "completed"].includes(status);
}

export function resolveParticipantEmail(primaryEmail?: string | null, fallbackEmail?: string | null) {
  return primaryEmail?.trim() || fallbackEmail?.trim() || null;
}
