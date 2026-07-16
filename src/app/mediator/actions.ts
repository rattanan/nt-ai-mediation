"use server";

import { redirect } from "next/navigation";
import { notifyAppointmentConfirmed, notifyRescheduleRequested } from "@/lib/appointment-notifications";
import { confirmAppointmentIfReady, normalizeMeetingUrl, recordAppointmentHistory, requestAppointmentReschedule } from "@/lib/appointments";
import { requireRole } from "@/lib/auth/server";
import {
  getMediatorProfileByUser,
  isValidThaiCitizenId,
  parseAvailabilityForm,
  parseMediatorProfileForm,
} from "@/lib/mediators";
import { formError, type FormState } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";
import { recalculateMediatorTrustScore } from "@/lib/trust-score";
import type { AppointmentStatus, MeetingType } from "@/types/database";
import { createGoogleMeetForAppointment } from "@/lib/google/workspace-meet";
import { queueMeetingProcessing } from "@/lib/meetings/processing";

const MEDIATOR_PROFILE_IMAGES_BUCKET = "mediator-profile-images";

function go(path: string, message: string, kind: "success" | "error" = "success"): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

async function uploadMediatorProfileImage(file: FormDataEntryValue | null, userId: string) {
  if (!(file instanceof File) || file.size === 0) return null;

  if (!file.type.startsWith("image/")) {
    throw new Error("กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/profile-${Date.now()}.${extension}`;
  const supabase = await createClient();
  const { error } = await supabase.storage.from(MEDIATOR_PROFILE_IMAGES_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });

  if (error) {
    console.error("Mediator profile image upload failed", error);
    throw new Error("อัปโหลดรูปโปรไฟล์ไม่สำเร็จ");
  }

  const { data } = supabase.storage.from(MEDIATOR_PROFILE_IMAGES_BUCKET).getPublicUrl(path);
  return data.publicUrl;
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

  if (payload.citizen_id && !isValidThaiCitizenId(payload.citizen_id)) {
    return formError(formData, "เลขบัตรประชาชนต้องเป็นเลขไทย 13 หลักและผ่านการตรวจสอบ");
  }

  const supabase = await createClient();
  const current = await getMediatorProfileByUser(profile.id);
  const nextStatus = submit
    ? "submitted"
    : current?.status === "approved"
      ? "submitted"
      : current?.status === "needs_revision"
        ? "needs_revision"
        : "draft";
  let uploadedProfilePhotoUrl: string | null = null;

  try {
    uploadedProfilePhotoUrl = await uploadMediatorProfileImage(formData.get("profile_photo_file"), profile.id);
  } catch (error) {
    return formError(formData, error instanceof Error ? error.message : "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ");
  }

  const { data, error } = await supabase
    .from("mediator_profiles")
    .upsert(
      {
        ...payload,
        profile_photo_url: uploadedProfilePhotoUrl ?? payload.profile_photo_url ?? current?.profile_photo_url ?? null,
        status: nextStatus,
        admin_review_note: submit ? null : current?.admin_review_note ?? null,
      },
      { onConflict: "user_id" },
    )
    .select("id, status")
    .single();

  if (error || !data) {
    console.error("Mediator profile upsert failed", error);
    return formError(formData, error?.message ?? "บันทึกข้อมูลผู้ไกล่เกลี่ยไม่สำเร็จ");
  }

  const { error: availabilityError } = await supabase
    .from("mediator_availability")
    .upsert(
      {
        mediator_profile_id: data.id,
        ...availability,
      },
      { onConflict: "mediator_profile_id" },
    );

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

function timeField(formData: FormData, name: string) {
  const value = String(formData.get(name) ?? "").trim();
  return value ? value.slice(0, 5) : null;
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

export async function saveWorkingHours(formData: FormData) {
  const { mediatorProfile } = await requireApprovedMediator();
  const supabase = await createClient();

  const rows = Array.from({ length: 7 }, (_, weekday) => {
    const enabled = formData.get(`weekday_${weekday}_enabled`) === "on";
    return {
      mediator_id: mediatorProfile.id,
      weekday,
      is_enabled: enabled,
      start_time: enabled ? timeField(formData, `weekday_${weekday}_start`) : null,
      end_time: enabled ? timeField(formData, `weekday_${weekday}_end`) : null,
      break_start: enabled ? timeField(formData, `weekday_${weekday}_break_start`) : null,
      break_end: enabled ? timeField(formData, `weekday_${weekday}_break_end`) : null,
      slot_duration_minutes: numberField(formData, `weekday_${weekday}_slot_duration`, 60),
      buffer_before_minutes: numberField(formData, `weekday_${weekday}_buffer_before`, 15),
      buffer_after_minutes: numberField(formData, `weekday_${weekday}_buffer_after`, 15),
    };
  });

  const invalid = rows.find((row) => {
    if (!row.is_enabled) return false;
    if (!row.start_time || !row.end_time || row.end_time <= row.start_time) return true;
    if (row.break_start && row.break_end && !(row.break_start < row.break_end)) return true;
    if (row.break_start && row.break_end && !(row.break_start >= row.start_time && row.break_end <= row.end_time)) return true;
    if (row.slot_duration_minutes <= 0 || row.buffer_before_minutes < 0 || row.buffer_after_minutes < 0) return true;
    return false;
  });

  if (invalid) {
    go("/mediator/availability", "กรุณาตรวจสอบวัน เวลา พักเที่ยง และ buffer ให้ถูกต้อง", "error");
  }

  const { error: deleteError } = await supabase.from("mediator_working_hours").delete().eq("mediator_id", mediatorProfile.id);
  if (deleteError) {
    console.error("Delete existing working hours failed", deleteError);
    go("/mediator/availability", `บันทึก Working Hours ไม่สำเร็จ: ${deleteError.message}`, "error");
  }

  const { error } = await supabase.from("mediator_working_hours").insert(rows);

  if (error) {
    console.error("Save working hours failed", error);
    go("/mediator/availability", `บันทึก Working Hours ไม่สำเร็จ: ${error.message}`, "error");
  }

  go("/mediator/availability", "บันทึก Working Hours แล้ว");
}

export async function seedDefaultWorkingHours() {
  const { mediatorProfile } = await requireApprovedMediator();
  const supabase = await createClient();

  const defaults = Array.from({ length: 7 }, (_, weekday) => ({
    mediator_id: mediatorProfile.id,
    weekday,
    is_enabled: weekday >= 1 && weekday <= 5,
    start_time: weekday >= 1 && weekday <= 5 ? "08:30" : null,
    end_time: weekday >= 1 && weekday <= 5 ? (weekday === 5 ? "16:30" : "17:00") : null,
    break_start: weekday >= 1 && weekday <= 5 ? "12:00" : null,
    break_end: weekday >= 1 && weekday <= 5 ? "13:00" : null,
    slot_duration_minutes: 60,
    buffer_before_minutes: 15,
    buffer_after_minutes: 15,
  }));

  const { error: deleteError } = await supabase.from("mediator_working_hours").delete().eq("mediator_id", mediatorProfile.id);
  if (deleteError) {
    console.error("Delete existing default working hours failed", deleteError);
    go("/mediator/availability", `สร้าง Working Hours เริ่มต้นไม่สำเร็จ: ${deleteError.message}`, "error");
  }

  const { error } = await supabase.from("mediator_working_hours").insert(defaults);

  if (error) {
    console.error("Seed default working hours failed", error);
    go("/mediator/availability", `สร้าง Working Hours เริ่มต้นไม่สำเร็จ: ${error.message}`, "error");
  }

  go("/mediator/availability", "สร้าง Working Hours เริ่มต้นแล้ว");
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
  const { profile, appointment } = await getMediatorAppointment(formData);
  const note = String(formData.get("note") ?? "").trim() || "ผู้ไกล่เกลี่ยขอเลื่อนนัดหมาย";
  const { error } = await requestAppointmentReschedule({
    appointment,
    actorId: profile.id,
    actorRole: "mediator",
    note,
  });

  if (error) go("/mediator/appointments", "ขอเลื่อนนัดหมายไม่สำเร็จ", "error");
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

export async function createMediatorGoogleMeet(formData: FormData) {
  const { profile, appointment } = await getMediatorAppointment(formData);
  try {
    await createGoogleMeetForAppointment(appointment.id, profile.id);
  } catch (error) {
    console.error("Mediator Google Meet creation failed", error);
    go(`/mediator/appointments/${appointment.id}`, error instanceof Error ? error.message : "สร้าง Google Meet ไม่สำเร็จ", "error");
  }
  go(`/mediator/appointments/${appointment.id}`, "สร้าง Google Meet และส่งคำเชิญแล้ว");
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
    if (appointment.recording_status === "enabled") await queueMeetingProcessing(appointment.id);
  }
  await recalculateMediatorTrustScore(appointment.mediator_id);

  go(`/mediator/appointments/${appointment.id}`, "อัปเดตสถานะนัดหมายแล้ว");
}
