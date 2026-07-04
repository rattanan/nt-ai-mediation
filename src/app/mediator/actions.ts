"use server";

import { redirect } from "next/navigation";
import { notifyAppointmentConfirmed, notifyRescheduleRequested } from "@/lib/appointment-notifications";
import { confirmAppointmentIfReady, normalizeMeetingUrl, recordAppointmentHistory } from "@/lib/appointments";
import { requireRole } from "@/lib/auth/server";
import { getMediatorProfileByUser, parseAvailabilityForm, parseMediatorProfileForm } from "@/lib/mediators";
import { formError, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { recalculateMediatorTrustScore } from "@/lib/trust-score";
import type { AppointmentStatus, MeetingType } from "@/types/database";

function go(path: string, message: string, kind: "success" | "error" = "success"): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

async function saveProfile(formData: FormData, submit: boolean): Promise<FormState> {
  const profile = await requireRole("mediator");
  const payload = parseMediatorProfileForm(formData, profile.id);
  const availability = parseAvailabilityForm(formData);
  const documents = String(formData.get("documents") ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (submit && (!payload.first_name || !payload.last_name || !payload.citizen_id || !payload.phone || !payload.province || !payload.mediator_license_number)) {
    return formError(formData, "กรุณากรอกข้อมูลสำคัญให้ครบก่อนส่งตรวจสอบ");
  }

  const supabase = await createClient();
  const current = await getMediatorProfileByUser(profile.id);
  const nextStatus = submit ? "submitted" : current?.status === "approved" ? "submitted" : "draft";

  const { data, error } = await supabase
    .from("mediator_profiles")
    .upsert({
      ...payload,
      status: nextStatus,
      admin_review_note: submit ? null : current?.admin_review_note ?? null,
    })
    .select("id, status")
    .single();

  if (error || !data) {
    console.error("Mediator profile upsert failed", error);
    return formError(formData, error?.message ?? "บันทึกข้อมูลผู้ไกล่เกลี่ยไม่สำเร็จ");
  }

  const { error: availabilityError } = await supabase.from("mediator_availability").upsert({
    mediator_profile_id: data.id,
    ...availability,
  });

  if (availabilityError) {
    console.error("Mediator availability upsert failed", availabilityError);
    return formError(formData, "บันทึกเวลาว่างผู้ไกล่เกลี่ยไม่สำเร็จ");
  }

  if (documents.length > 0) {
    const { error: deleteError } = await supabase.from("mediator_documents").delete().eq("mediator_profile_id", data.id);
    if (deleteError) {
      console.error("Mediator documents delete failed", deleteError);
      return formError(formData, "บันทึกเอกสารผู้ไกล่เกลี่ยไม่สำเร็จ");
    }

    const { error: insertDocumentsError } = await supabase.from("mediator_documents").insert(
      documents.map((url, index) => ({
        mediator_profile_id: data.id,
        document_type: index === 0 ? "mediator_certificate" : "supporting_document",
        file_name: url,
        file_url: url,
        visibility: "admin_only" as const,
      })),
    );

    if (insertDocumentsError) {
      console.error("Mediator documents insert failed", insertDocumentsError);
      return formError(formData, "บันทึกเอกสารผู้ไกล่เกลี่ยไม่สำเร็จ");
    }
  }

  go("/mediator/profile", submit ? "ส่งโปรไฟล์ให้ผู้ดูแลตรวจสอบแล้ว" : "บันทึกแบบร่างโปรไฟล์แล้ว");
}

export async function saveMediatorDraft(_state: FormState, formData: FormData): Promise<FormState> {
  return saveProfile(formData, false);
}

export async function submitMediatorProfile(_state: FormState, formData: FormData): Promise<FormState> {
  return saveProfile(formData, true);
}

async function requireApprovedMediator() {
  const profile = await requireRole("mediator");
  const mediatorProfile = await getMediatorProfileByUser(profile.id);
  if (!mediatorProfile || mediatorProfile.status !== "approved") {
    go("/mediator/profile", "โปรไฟล์ต้องได้รับอนุมัติก่อนจัดการนัดหมาย", "error");
  }
  return { profile, mediatorProfile };
}

function numberField(formData: FormData, name: string, fallback: number) {
  const parsed = Number(String(formData.get(name) ?? ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export async function createAvailabilitySlot(formData: FormData) {
  const { mediatorProfile } = await requireApprovedMediator();
  const isRecurring = formData.get("is_recurring") === "on";
  const slotDate = String(formData.get("slot_date") ?? "").trim();
  const dayOfWeek = String(formData.get("day_of_week") ?? "").trim();
  const startTime = String(formData.get("start_time") ?? "").trim();
  const endTime = String(formData.get("end_time") ?? "").trim();
  const meetingType = String(formData.get("meeting_type") ?? "online") as MeetingType;

  if ((!isRecurring && !slotDate) || (isRecurring && dayOfWeek === "") || !startTime || !endTime) {
    go("/mediator/availability", "กรุณากรอกวันและเวลาให้ครบถ้วน", "error");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mediator_availability_slots").insert({
    mediator_profile_id: mediatorProfile.id,
    slot_date: isRecurring ? null : slotDate,
    day_of_week: isRecurring ? Number(dayOfWeek) : null,
    start_time: startTime,
    end_time: endTime,
    timezone: String(formData.get("timezone") ?? "Asia/Bangkok").trim() || "Asia/Bangkok",
    meeting_type: meetingType,
    is_recurring: isRecurring,
    active: formData.get("active") !== "off",
    max_cases_per_day: numberField(formData, "max_cases_per_day", 3),
    max_cases_per_month: numberField(formData, "max_cases_per_month", 20),
    note: String(formData.get("note") ?? "").trim() || null,
  });

  if (error) go("/mediator/availability", "บันทึกเวลาว่างไม่สำเร็จ", "error");
  go("/mediator/availability", "เพิ่มเวลาว่างแล้ว");
}

export async function updateAvailabilitySlot(formData: FormData) {
  const { mediatorProfile } = await requireApprovedMediator();
  const slotId = String(formData.get("slot_id") ?? "");
  if (!slotId) go("/mediator/availability", "ไม่พบเวลาว่างที่ต้องการแก้ไข", "error");

  const supabase = await createClient();
  const { error } = await supabase
    .from("mediator_availability_slots")
    .update({
      start_time: String(formData.get("start_time") ?? "").trim(),
      end_time: String(formData.get("end_time") ?? "").trim(),
      meeting_type: String(formData.get("meeting_type") ?? "online") as MeetingType,
      max_cases_per_day: numberField(formData, "max_cases_per_day", 3),
      max_cases_per_month: numberField(formData, "max_cases_per_month", 20),
      active: formData.get("active") === "on",
      note: String(formData.get("note") ?? "").trim() || null,
    })
    .eq("id", slotId)
    .eq("mediator_profile_id", mediatorProfile.id);

  if (error) go("/mediator/availability", "แก้ไขเวลาว่างไม่สำเร็จ", "error");
  go("/mediator/availability", "แก้ไขเวลาว่างแล้ว");
}

export async function disableAvailabilitySlot(formData: FormData) {
  const { mediatorProfile } = await requireApprovedMediator();
  const slotId = String(formData.get("slot_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("mediator_availability_slots")
    .update({ active: false })
    .eq("id", slotId)
    .eq("mediator_profile_id", mediatorProfile.id);

  if (error) go("/mediator/availability", "ปิดเวลาว่างไม่สำเร็จ", "error");
  go("/mediator/availability", "ปิดเวลาว่างแล้ว");
}

async function getMediatorAppointment(formData: FormData) {
  const { profile, mediatorProfile } = await requireApprovedMediator();
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const supabase = await createClient();
  const { data: appointment } = await supabase
    .from("mediation_appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("mediator_id", mediatorProfile.id)
    .maybeSingle();

  if (!appointment) {
    go("/mediator/appointments", "ไม่พบนัดหมายของคุณ", "error");
  }

  return { profile, supabase, appointment, caseId };
}

export async function confirmMediatorAppointment(formData: FormData) {
  const { profile, supabase, appointment, caseId } = await getMediatorAppointment(formData);
  const now = new Date().toISOString();
  const note = String(formData.get("note") ?? "").trim();

  const { error } = await supabase
    .from("mediation_appointments")
    .update({
      confirmed_by_mediator_at: now,
      status: appointment.status === "requested" ? "pending_confirmation" : appointment.status,
    })
    .eq("id", appointment.id);

  if (error) go("/mediator/appointments", "ยืนยันนัดหมายไม่สำเร็จ", "error");

  await supabase
    .from("appointment_participants")
    .update({ status: "confirmed", confirmed_at: now, note: note || null, profile_id: profile.id })
    .eq("appointment_id", appointment.id)
    .eq("role", "mediator");

  await recordAppointmentHistory(appointment.id, appointment.status, "pending_confirmation", profile.id, note || "ผู้ไกล่เกลี่ยยืนยันนัดหมาย");
  const confirmed = await confirmAppointmentIfReady(appointment.id, profile.id);
  if (confirmed?.status === "confirmed") {
    await notifyAppointmentConfirmed({ appointmentId: appointment.id, caseId: appointment.case_id, status: "confirmed" });
  }

  go(caseId ? `/mediator/appointments/${appointment.id}` : "/mediator/appointments", "ยืนยันนัดหมายแล้ว");
}

export async function requestMediatorReschedule(formData: FormData) {
  const { profile, supabase, appointment } = await getMediatorAppointment(formData);
  const note = String(formData.get("note") ?? "").trim() || "ผู้ไกล่เกลี่ยขอเลื่อนนัดหมาย";
  const { error } = await supabase
    .from("mediation_appointments")
    .update({ status: "reschedule_requested", cancellation_reason: note })
    .eq("id", appointment.id);

  if (error) go("/mediator/appointments", "ขอเลื่อนนัดหมายไม่สำเร็จ", "error");
  await supabase.from("appointment_participants").update({ status: "reschedule_requested", note }).eq("appointment_id", appointment.id).eq("role", "mediator");
  await recordAppointmentHistory(appointment.id, appointment.status, "reschedule_requested", profile.id, note);
  await notifyRescheduleRequested({ appointmentId: appointment.id, caseId: appointment.case_id, status: "reschedule_requested" });
  go(`/mediator/appointments/${appointment.id}`, "ส่งคำขอเลื่อนนัดหมายแล้ว");
}

export async function updateAppointmentMeetingUrl(formData: FormData) {
  const { profile, supabase, appointment } = await getMediatorAppointment(formData);
  const normalized = normalizeMeetingUrl(String(formData.get("meeting_url") ?? ""));
  if (normalized.error) go(`/mediator/appointments/${appointment.id}`, normalized.error, "error");

  const { error } = await supabase
    .from("mediation_appointments")
    .update({ meeting_url: normalized.url, meeting_provider: normalized.provider })
    .eq("id", appointment.id);

  if (error) go(`/mediator/appointments/${appointment.id}`, "บันทึกลิงก์ประชุมไม่สำเร็จ", "error");
  await recordAppointmentHistory(appointment.id, appointment.status, appointment.status, profile.id, "อัปเดต Meeting URL");
  go(`/mediator/appointments/${appointment.id}`, "บันทึกลิงก์ประชุมแล้ว");
}

export async function markAppointmentOutcome(formData: FormData) {
  const { profile, supabase, appointment } = await getMediatorAppointment(formData);
  const nextStatus = String(formData.get("status") ?? "") as AppointmentStatus;
  const note = String(formData.get("note") ?? "").trim();
  if (!["completed", "no_show"].includes(nextStatus)) {
    go(`/mediator/appointments/${appointment.id}`, "สถานะนัดหมายไม่ถูกต้อง", "error");
  }

  const { error } = await supabase.from("mediation_appointments").update({ status: nextStatus }).eq("id", appointment.id);
  if (error) go(`/mediator/appointments/${appointment.id}`, "อัปเดตสถานะนัดหมายไม่สำเร็จ", "error");

  await recordAppointmentHistory(appointment.id, appointment.status, nextStatus, profile.id, note || "ผู้ไกล่เกลี่ยอัปเดตผลนัดหมาย");
  if (nextStatus === "completed") {
    await supabase.from("cases").update({ status: "in_mediation" }).eq("id", appointment.case_id);
  }
  await recalculateMediatorTrustScore(appointment.mediator_id);

  go(`/mediator/appointments/${appointment.id}`, "อัปเดตสถานะนัดหมายแล้ว");
}
