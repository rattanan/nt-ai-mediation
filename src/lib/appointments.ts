import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AppointmentParticipantRole,
  AppointmentParticipantStatus,
  AppointmentStatus,
  Database,
  MeetingProvider,
  MeetingType,
} from "@/types/database";
import { generateAvailableSlots } from "@/lib/availability-engine";

export type Appointment = Database["public"]["Tables"]["mediation_appointments"]["Row"];
export type AppointmentParticipant = Database["public"]["Tables"]["appointment_participants"]["Row"];
export type AppointmentHistory = Database["public"]["Tables"]["appointment_status_history"]["Row"];
export type AvailabilitySlot = Database["public"]["Tables"]["mediator_availability_slots"]["Row"];
export type AppointmentCase = Database["public"]["Tables"]["cases"]["Row"];
export type MediatorProfile = Database["public"]["Tables"]["mediator_profiles"]["Row"];
export type CreditorOrganization = Database["public"]["Tables"]["creditor_organizations"]["Row"];
export type Profile = Pick<Database["public"]["Tables"]["profiles"]["Row"], "id" | "full_name" | "email">;

export type AppointmentWithDetails = Appointment & {
  cases?: AppointmentCase | null;
  mediator_profiles?: MediatorProfile | null;
  creditor_organizations?: CreditorOrganization | null;
  debtor_profile?: Profile | null;
  appointment_participants?: AppointmentParticipant[] | null;
  appointment_status_history?: AppointmentHistory[] | null;
};

export type AvailableSlotView = {
  key: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  meetingType: MeetingType;
  isRecurring: boolean;
  maxCasesPerDay: number;
  maxCasesPerMonth: number;
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  requested: "ส่งคำขอนัดหมาย",
  pending_confirmation: "รอยืนยันนัดหมาย",
  confirmed: "ยืนยันนัดหมายแล้ว",
  reschedule_requested: "ขอเลื่อนนัด",
  completed: "ไกล่เกลี่ยเสร็จสิ้น",
  cancelled: "ยกเลิกนัดหมาย",
  no_show: "ไม่เข้าร่วมตามนัด",
};

export const meetingTypeLabels: Record<MeetingType, string> = {
  online: "ออนไลน์",
  onsite: "พบที่สถานที่จริง",
  hybrid: "ออนไลน์/สถานที่จริง",
};

export const meetingProviderLabels: Record<MeetingProvider, string> = {
  manual_link: "ลิงก์ที่กรอกเอง",
  google_meet: "Google Meet",
  zoom: "Zoom",
  other: "อื่น ๆ",
};

export const participantStatusLabels: Record<AppointmentParticipantStatus, string> = {
  pending: "รอยืนยัน",
  confirmed: "ยืนยันแล้ว",
  reschedule_requested: "ขอเลื่อนนัด",
  declined: "ปฏิเสธ",
  no_show: "ไม่เข้าร่วม",
};

export const activeAppointmentStatuses: AppointmentStatus[] = [
  "requested",
  "pending_confirmation",
  "confirmed",
  "reschedule_requested",
];

function todayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00+07:00`);
  value.setDate(value.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function dayOfWeek(date: string) {
  return new Date(`${date}T00:00:00+07:00`).getDay();
}

function monthKey(date: string) {
  return date.slice(0, 7);
}

function parseTimeRanges(values: unknown) {
  const raw = Array.isArray(values) ? values : [];
  return raw
    .map((item) => String(item).trim())
    .filter(Boolean)
    .map((item) => {
      const [startTime, endTime] = item.split(/\s*-\s*/);
      return startTime && endTime ? { startTime: startTime.slice(0, 5), endTime: endTime.slice(0, 5) } : null;
    })
    .filter((item): item is { startTime: string; endTime: string } => Boolean(item));
}

export function formatThaiDate(date: string) {
  return new Date(`${date}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatAppointmentDateTime(appointment: Pick<Appointment, "appointment_date" | "start_time" | "end_time" | "timezone">) {
  return `${formatThaiDate(appointment.appointment_date)} ${appointment.start_time.slice(0, 5)}-${appointment.end_time.slice(0, 5)} (${appointment.timezone})`;
}

export function normalizeMeetingUrl(value: string) {
  const url = value.trim();
  if (!url) return { url: null, provider: "manual_link" as MeetingProvider };

  try {
    const parsed = new URL(url);
    if (!["https:", "http:"].includes(parsed.protocol)) {
      return { error: "กรุณากรอก URL ที่ขึ้นต้นด้วย http:// หรือ https://" };
    }

    const hostname = parsed.hostname.toLowerCase();
    const provider: MeetingProvider = hostname.includes("zoom.us")
      ? "zoom"
      : hostname.includes("meet.google.com")
        ? "google_meet"
        : hostname.includes("teams.microsoft.com")
          ? "other"
          : "manual_link";

    return { url: parsed.toString(), provider };
  } catch {
    return { error: "รูปแบบ Meeting URL ไม่ถูกต้อง" };
  }
}

export async function getActiveAppointmentForCase(caseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("*, appointment_participants(*), appointment_status_history(*)")
    .eq("case_id", caseId)
    .in("status", activeAppointmentStatuses)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (data ?? null) as AppointmentWithDetails | null;
}

export async function getAppointmentDetail(appointmentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("*, cases(*), mediator_profiles(*), creditor_organizations(*), appointment_participants(*), appointment_status_history(*)")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!data) notFound();
  const appointment = data as unknown as AppointmentWithDetails;
  const { data: debtorProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", appointment.debtor_user_id)
    .maybeSingle();

  return { ...appointment, debtor_profile: debtorProfile ?? null };
}

export async function getAppointmentsForDebtor(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("*, cases(*), mediator_profiles(*), creditor_organizations(*), appointment_participants(*)")
    .eq("debtor_user_id", userId)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (data ?? []) as unknown as AppointmentWithDetails[];
}

export async function getAppointmentsForMediator(mediatorProfileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("*, cases(*), creditor_organizations(*), appointment_participants(*)")
    .eq("mediator_id", mediatorProfileId)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (data ?? []) as unknown as AppointmentWithDetails[];
}

export async function getAppointmentsForCreditorOrganization(organizationId?: string | null) {
  if (!organizationId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("*, cases(*), mediator_profiles(*), appointment_participants(*)")
    .eq("creditor_organization_id", organizationId)
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  return (data ?? []) as unknown as AppointmentWithDetails[];
}

export async function getAdminAppointments(filters?: {
  status?: AppointmentStatus;
  mediatorId?: string;
  creditorOrganizationId?: string;
  date?: string;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("mediation_appointments")
    .select("*, cases(*), mediator_profiles(*), creditor_organizations(*), appointment_participants(*)")
    .order("appointment_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.mediatorId) query = query.eq("mediator_id", filters.mediatorId);
  if (filters?.creditorOrganizationId) query = query.eq("creditor_organization_id", filters.creditorOrganizationId);
  if (filters?.date) query = query.eq("appointment_date", filters.date);

  const { data } = await query;
  return (data ?? []) as unknown as AppointmentWithDetails[];
}

export async function getMediatorAvailabilitySlots(mediatorProfileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediator_availability_slots")
    .select("*")
    .eq("mediator_profile_id", mediatorProfileId)
    .order("active", { ascending: false })
    .order("slot_date", { ascending: true })
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  return data ?? [];
}

export async function getAvailableSlotsForCase(caseId: string, debtorUserId: string) {
  const supabase = await createClient();
  const { data: currentCase } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("debtor_user_id", debtorUserId)
    .maybeSingle();

  if (!currentCase || !currentCase.selected_mediator_profile_id) return [];

  const startDate = todayString();
  const endDate = addDays(startDate, 45);
  const generatedSlots = await generateAvailableSlots(currentCase.selected_mediator_profile_id, startDate, endDate);

  const { data: slots } = await supabase
    .from("mediator_availability_slots")
    .select("*")
    .eq("mediator_profile_id", currentCase.selected_mediator_profile_id)
    .eq("active", true)
    .order("start_time", { ascending: true });

  const { data: availability } = await supabase
    .from("mediator_availability")
    .select("*")
    .eq("mediator_profile_id", currentCase.selected_mediator_profile_id)
    .maybeSingle();

  const { data: appointments } = await supabase
    .from("mediation_appointments")
    .select("appointment_date, start_time, end_time, status")
    .eq("mediator_id", currentCase.selected_mediator_profile_id)
    .gte("appointment_date", startDate)
    .lte("appointment_date", endDate)
    .in("status", activeAppointmentStatuses);

  const bookings = appointments ?? [];
  const bookingCountByDate = new Map<string, number>();
  const bookingCountByMonth = new Map<string, number>();
  const bookedSlotKeys = new Set<string>();

  bookings.forEach((booking) => {
    bookingCountByDate.set(booking.appointment_date, (bookingCountByDate.get(booking.appointment_date) ?? 0) + 1);
    bookingCountByMonth.set(monthKey(booking.appointment_date), (bookingCountByMonth.get(monthKey(booking.appointment_date)) ?? 0) + 1);
    bookedSlotKeys.add(`${booking.appointment_date}|${booking.start_time.slice(0, 5)}|${booking.end_time.slice(0, 5)}`);
  });

  const expanded: AvailableSlotView[] = [];
  const rows = slots ?? [];
  const fallbackDays = availability?.active
    ? new Set(
        (Array.isArray(availability.available_days) ? availability.available_days : [])
          .map((item) => {
            const value = String(item).trim();
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : value;
          }),
      )
    : new Set<number | string>();
  const fallbackTimeRanges = availability?.active ? parseTimeRanges(availability.available_time_slots) : [];

  if (generatedSlots.length > 0) {
    for (const slot of generatedSlots) {
      const occupied = bookedSlotKeys.has(`${slot.date}|${slot.start}|${slot.end}`);
      const dailyFull = (bookingCountByDate.get(slot.date) ?? 0) >= 3;
      const monthlyFull = (bookingCountByMonth.get(monthKey(slot.date)) ?? 0) >= (availability?.max_cases_per_month ?? 20);
      if (occupied || dailyFull || monthlyFull) continue;

      expanded.push({
        key: `working-hours:${slot.date}:${slot.start}-${slot.end}`,
        slotId: currentCase.selected_mediator_profile_id,
        date: slot.date,
        startTime: slot.start,
        endTime: slot.end,
        timezone: "Asia/Bangkok",
        meetingType: "online",
        isRecurring: true,
        maxCasesPerDay: 3,
        maxCasesPerMonth: 20,
      });
    }
  } else {
    for (let offset = 0; offset <= 45; offset += 1) {
      const date = addDays(startDate, offset);
      const weekday = dayOfWeek(date);

      for (const slot of rows) {
        const matches = slot.is_recurring
          ? slot.day_of_week === weekday
          : slot.slot_date === date;
        if (!matches) continue;

        const startTime = slot.start_time.slice(0, 5);
        const endTime = slot.end_time.slice(0, 5);
        const occupied = bookedSlotKeys.has(`${date}|${startTime}|${endTime}`);
        const dailyFull = (bookingCountByDate.get(date) ?? 0) >= slot.max_cases_per_day;
        const monthlyFull = (bookingCountByMonth.get(monthKey(date)) ?? 0) >= slot.max_cases_per_month;

        if (occupied || dailyFull || monthlyFull) continue;

        expanded.push({
          key: `${slot.id}:${date}`,
          slotId: slot.id,
          date,
          startTime,
          endTime,
          timezone: slot.timezone,
          meetingType: slot.meeting_type,
          isRecurring: slot.is_recurring,
          maxCasesPerDay: slot.max_cases_per_day,
          maxCasesPerMonth: slot.max_cases_per_month,
        });
      }

      if (rows.length === 0 && fallbackDays.size > 0 && fallbackTimeRanges.length > 0 && fallbackDays.has(weekday)) {
        for (const range of fallbackTimeRanges) {
          const occupied = bookedSlotKeys.has(`${date}|${range.startTime}|${range.endTime}`);
          const dailyFull = (bookingCountByDate.get(date) ?? 0) >= 3;
          const monthlyFull = (bookingCountByMonth.get(monthKey(date)) ?? 0) >= (availability?.max_cases_per_month ?? 10);
          if (occupied || dailyFull || monthlyFull) continue;

          expanded.push({
            key: `availability:${date}:${range.startTime}-${range.endTime}`,
            slotId: availability?.id ?? "fallback",
            date,
            startTime: range.startTime,
            endTime: range.endTime,
            timezone: "Asia/Bangkok",
            meetingType: "online",
            isRecurring: true,
            maxCasesPerDay: 3,
            maxCasesPerMonth: availability?.max_cases_per_month ?? 10,
          });
        }
      }
    }
  }

  return expanded.sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

export async function recordAppointmentHistory(
  appointmentId: string,
  fromStatus: AppointmentStatus | null,
  toStatus: AppointmentStatus,
  changedBy: string,
  note?: string,
) {
  const supabase = await createClient();
  await supabase.from("appointment_status_history").insert({
    appointment_id: appointmentId,
    from_status: fromStatus,
    to_status: toStatus,
    changed_by: changedBy,
    note: note?.trim() || null,
  });
}

export async function requestAppointmentReschedule(input: {
  appointment: Appointment;
  actorId: string;
  actorRole: AppointmentParticipantRole;
  note: string;
}) {
  const supabase = await createClient();
  const { appointment, actorId, actorRole, note } = input;

  const { error } = await supabase
    .from("mediation_appointments")
    .update({
      status: "reschedule_requested",
      cancellation_reason: note,
      confirmed_by_debtor_at: null,
      confirmed_by_creditor_at: null,
      confirmed_by_mediator_at: null,
    })
    .eq("id", appointment.id);

  if (error) return { error };

  await supabase
    .from("appointment_participants")
    .update({ status: "pending", confirmed_at: null, note: null })
    .eq("appointment_id", appointment.id);

  await supabase
    .from("appointment_participants")
    .update({ status: "reschedule_requested", confirmed_at: null, note, profile_id: actorId })
    .eq("appointment_id", appointment.id)
    .eq("role", actorRole);

  if (actorRole === "admin") {
    const { data: adminParticipant } = await supabase
      .from("appointment_participants")
      .select("id")
      .eq("appointment_id", appointment.id)
      .eq("role", "admin")
      .eq("profile_id", actorId)
      .maybeSingle();

    if (!adminParticipant) {
      await supabase.from("appointment_participants").insert({
        appointment_id: appointment.id,
        profile_id: actorId,
        role: "admin",
        status: "reschedule_requested",
        note,
      });
    }
  }

  await recordAppointmentHistory(appointment.id, appointment.status, "reschedule_requested", actorId, note);
  return { error: null };
}

export async function confirmAppointmentIfReady(appointmentId: string, actorId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("*")
    .eq("id", appointmentId)
    .maybeSingle();

  if (!data) return null;
  const appointment = data as Appointment;
  const ready = Boolean(appointment.confirmed_by_debtor_at && appointment.confirmed_by_creditor_at && appointment.confirmed_by_mediator_at);

  if (!ready || appointment.status === "confirmed") return appointment;

  const { error } = await supabase.from("mediation_appointments").update({ status: "confirmed" }).eq("id", appointment.id);
  if (!error) {
    await recordAppointmentHistory(appointment.id, appointment.status, "confirmed", actorId, "ทุกฝ่ายยืนยันนัดหมายแล้ว");
    await supabase.from("cases").update({ status: "scheduled" }).eq("id", appointment.case_id);
    await supabase.from("case_status_history").insert({
      case_id: appointment.case_id,
      from_status: "appointment_scheduling",
      to_status: "scheduled",
      changed_by: actorId,
      note: "ทุกฝ่ายยืนยันนัดหมายไกล่เกลี่ยแล้ว",
    });
  }

  return { ...appointment, status: "confirmed" as AppointmentStatus };
}

export function isUpcomingAppointment(appointment: Appointment) {
  return activeAppointmentStatuses.includes(appointment.status) && appointment.appointment_date >= todayString();
}
