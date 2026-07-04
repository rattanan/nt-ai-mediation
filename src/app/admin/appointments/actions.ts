"use server";

import { redirect } from "next/navigation";
import { notifyAppointmentCancelled, notifyRescheduleRequested } from "@/lib/appointment-notifications";
import { normalizeMeetingUrl, recordAppointmentHistory } from "@/lib/appointments";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

function go(message: string, kind: "success" | "error" = "success"): never {
  redirect(`/admin/appointments?${kind}=${encodeURIComponent(message)}`);
}

async function getAdminAppointment(formData: FormData) {
  const admin = await requireRole("admin");
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const supabase = await createClient();
  const { data: appointment } = await supabase.from("mediation_appointments").select("*").eq("id", appointmentId).maybeSingle();
  if (!appointment) go("ไม่พบนัดหมายที่ต้องการจัดการ", "error");
  return { admin, supabase, appointment };
}

export async function adminCancelAppointment(formData: FormData) {
  const { admin, supabase, appointment } = await getAdminAppointment(formData);
  const reason = String(formData.get("reason") ?? "").trim() || "ผู้ดูแลระบบยกเลิกนัดหมาย";
  const { error } = await supabase.from("mediation_appointments").update({ status: "cancelled", cancellation_reason: reason }).eq("id", appointment.id);
  if (error) go("ยกเลิกนัดหมายไม่สำเร็จ", "error");
  await recordAppointmentHistory(appointment.id, appointment.status, "cancelled", admin.id, reason);
  await notifyAppointmentCancelled({ appointmentId: appointment.id, caseId: appointment.case_id, status: "cancelled" });
  go("ยกเลิกนัดหมายแล้ว");
}

export async function adminForceReschedule(formData: FormData) {
  const { admin, supabase, appointment } = await getAdminAppointment(formData);
  const reason = String(formData.get("reason") ?? "").trim() || "ผู้ดูแลระบบขอให้เลื่อนนัดหมาย";
  const { error } = await supabase.from("mediation_appointments").update({ status: "reschedule_requested", cancellation_reason: reason }).eq("id", appointment.id);
  if (error) go("ขอเลื่อนนัดหมายไม่สำเร็จ", "error");
  await recordAppointmentHistory(appointment.id, appointment.status, "reschedule_requested", admin.id, reason);
  await notifyRescheduleRequested({ appointmentId: appointment.id, caseId: appointment.case_id, status: "reschedule_requested" });
  go("ส่งคำขอเลื่อนนัดหมายแล้ว");
}

export async function adminUpdateMeetingUrl(formData: FormData) {
  const { admin, supabase, appointment } = await getAdminAppointment(formData);
  const normalized = normalizeMeetingUrl(String(formData.get("meeting_url") ?? ""));
  if (normalized.error) go(normalized.error, "error");
  const { error } = await supabase
    .from("mediation_appointments")
    .update({ meeting_url: normalized.url, meeting_provider: normalized.provider })
    .eq("id", appointment.id);
  if (error) go("บันทึกลิงก์ประชุมไม่สำเร็จ", "error");
  await recordAppointmentHistory(appointment.id, appointment.status, appointment.status, admin.id, "ผู้ดูแลระบบอัปเดต Meeting URL");
  go("บันทึกลิงก์ประชุมแล้ว");
}
