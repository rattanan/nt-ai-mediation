export function googleCalendarEventId(appointmentId: string) {
  return `ntm${appointmentId.replaceAll("-", "")}`;
}

export function isGoogleMeetEligible(meetingType: string, status: string) {
  return ["online", "hybrid"].includes(meetingType) && !["cancelled", "completed"].includes(status);
}

