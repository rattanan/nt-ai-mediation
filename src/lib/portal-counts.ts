import "server-only";

import { activeAppointmentStatuses, type Appointment } from "@/lib/appointments";
import { createClient } from "@/lib/supabase/server";
import type { BillingInvoiceStatus, CaseStatus } from "@/types/database";

const openCaseStatuses: CaseStatus[] = [
  "draft",
  "submitted",
  "reviewing",
  "admin_review",
  "needs_more_info",
  "creditor_review",
  "creditor_accepted",
  "matched",
  "mediator_matching",
  "mediator_selected",
  "scheduled",
  "appointment_scheduling",
  "in_mediation",
  "settlement_draft",
];

const unpaidInvoiceStatuses: BillingInvoiceStatus[] = ["draft", "issued", "sent", "overdue"];
const adminActiveCaseStatuses: CaseStatus[] = [
  "submitted", "reviewing", "admin_review", "needs_more_info", "creditor_review",
  "creditor_accepted", "matched", "mediator_matching", "mediator_selected",
  "appointment_scheduling", "scheduled", "in_mediation", "settlement_draft",
];

function bangkokNowParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "00";
  return {
    date: `${value("year")}-${value("month")}-${value("day")}`,
    minutes: Number(value("hour")) * 60 + Number(value("minute")),
  };
}

function appointmentStartMinutes(appointment: Pick<Appointment, "start_time">) {
  const [hour = "0", minute = "0"] = appointment.start_time.slice(0, 5).split(":");
  return Number(hour) * 60 + Number(minute);
}

function isUpcomingAppointment(appointment: Pick<Appointment, "appointment_date" | "start_time" | "status">) {
  if (!activeAppointmentStatuses.includes(appointment.status)) return false;
  const now = bangkokNowParts();
  if (appointment.appointment_date > now.date) return true;
  if (appointment.appointment_date < now.date) return false;
  return appointmentStartMinutes(appointment) >= now.minutes;
}

export async function countOpenCreditorCases(organizationId?: string | null) {
  if (!organizationId) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("creditor_organization_id", organizationId)
    .in("status", openCaseStatuses);
  return count ?? 0;
}

export async function countActiveAdminCases() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("cases")
    .select("id", { count: "exact", head: true })
    .in("status", adminActiveCaseStatuses);
  return count ?? 0;
}

export async function countUpcomingAdminAppointments() {
  const supabase = await createClient();
  const now = bangkokNowParts();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("appointment_date, start_time, status")
    .in("status", activeAppointmentStatuses)
    .gte("appointment_date", now.date);
  return (data ?? []).filter(isUpcomingAppointment).length;
}

export async function countUnpaidCreditorInvoices(organizationId?: string | null) {
  if (!organizationId) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("billing_invoices")
    .select("id", { count: "exact", head: true })
    .eq("creditor_organization_id", organizationId)
    .in("status", unpaidInvoiceStatuses);
  return count ?? 0;
}

export async function countUpcomingCreditorAppointments(organizationId?: string | null) {
  if (!organizationId) return 0;
  const supabase = await createClient();
  const now = bangkokNowParts();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("appointment_date, start_time, status")
    .eq("creditor_organization_id", organizationId)
    .in("status", activeAppointmentStatuses)
    .gte("appointment_date", now.date);
  return (data ?? []).filter(isUpcomingAppointment).length;
}

export async function countUpcomingDebtorAppointments(userId: string) {
  const supabase = await createClient();
  const now = bangkokNowParts();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("appointment_date, start_time, status")
    .eq("debtor_user_id", userId)
    .in("status", activeAppointmentStatuses)
    .gte("appointment_date", now.date);
  return (data ?? []).filter(isUpcomingAppointment).length;
}

export async function countPendingDebtorAiInterviews(userId: string) {
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("id")
    .eq("debtor_user_id", userId)
    .in("status", ["draft", "needs_more_info"]);
  const caseIds = (cases ?? []).map((item) => item.id);

  if (caseIds.length === 0) return 0;

  const { data: sessions } = await supabase
    .from("case_ai_sessions")
    .select("case_id, status")
    .in("case_id", caseIds);
  const sessionByCaseId = new Map((sessions ?? []).map((session) => [session.case_id, session.status]));

  return caseIds.filter((caseId) => {
    const status = sessionByCaseId.get(caseId);
    return !status || ["pending", "processing", "interview", "failed"].includes(status);
  }).length;
}

export async function countOpenMediatorCases(mediatorProfileId?: string | null) {
  if (!mediatorProfileId) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("cases")
    .select("id", { count: "exact", head: true })
    .eq("selected_mediator_profile_id", mediatorProfileId)
    .in("status", openCaseStatuses);
  return count ?? 0;
}

export async function countUpcomingMediatorAppointments(mediatorProfileId?: string | null) {
  if (!mediatorProfileId) return 0;
  const supabase = await createClient();
  const now = bangkokNowParts();
  const { data } = await supabase
    .from("mediation_appointments")
    .select("appointment_date, start_time, status")
    .eq("mediator_id", mediatorProfileId)
    .in("status", activeAppointmentStatuses)
    .gte("appointment_date", now.date);
  return (data ?? []).filter(isUpcomingAppointment).length;
}
