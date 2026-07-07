"use server";

import { redirect } from "next/navigation";
import { notifyAppointmentRequested, notifyRescheduleRequested } from "@/lib/appointment-notifications";
import { getActiveAppointmentForCase, getAvailableSlotsForCase, recordAppointmentHistory, requestAppointmentReschedule } from "@/lib/appointments";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor } from "@/lib/cases";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function bookAppointment(caseId: string, formData: FormData) {
  const debtor = await requireRole("debtor");
  const slotKey = String(formData.get("slot_key") ?? "");
  const currentCase = await getCaseForDebtor(caseId, debtor.id);

  if (!currentCase.selected_mediator_profile_id) {
    redirect(`/debtor/cases/${caseId}?error=${encodeURIComponent("กรุณาเลือกผู้ไกล่เกลี่ยก่อนนัดหมาย")}`);
  }

  const slots = await getAvailableSlotsForCase(caseId, debtor.id);
  const slot = slots.find((item) => item.key === slotKey);

  if (!slot) {
    redirect(`/debtor/cases/${caseId}/appointments/new?error=${encodeURIComponent("ช่วงเวลานี้ไม่พร้อมใช้งานแล้ว กรุณาเลือกเวลาใหม่")}`);
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const activeAppointment = await getActiveAppointmentForCase(caseId);
  const { data: creditorOfficer } = currentCase.creditor_organization_id
    ? await supabase
      .from("creditor_officers")
      .select("user_id")
      .eq("organization_id", currentCase.creditor_organization_id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    : { data: null };

  const appointmentPayload = {
    case_id: currentCase.id,
    mediator_id: currentCase.selected_mediator_profile_id,
    debtor_user_id: debtor.id,
    creditor_organization_id: currentCase.creditor_organization_id,
    creditor_officer_user_id: creditorOfficer?.user_id ?? null,
    appointment_date: slot.date,
    start_time: slot.startTime,
    end_time: slot.endTime,
    timezone: slot.timezone,
    meeting_type: slot.meetingType,
    status: "pending_confirmation" as const,
    requested_by: debtor.id,
    confirmed_by_debtor_at: now,
    confirmed_by_creditor_at: null,
    confirmed_by_mediator_at: null,
    meeting_url: null,
    meeting_provider: "manual_link" as const,
    cancellation_reason: null,
  };

  const { data: appointment, error } = activeAppointment?.status === "reschedule_requested"
    ? await supabase
      .from("mediation_appointments")
      .update(appointmentPayload)
      .eq("id", activeAppointment.id)
      .select()
      .single()
    : await supabase
      .from("mediation_appointments")
      .insert(appointmentPayload)
      .select()
      .single();

  if (error || !appointment) {
    redirect(`/debtor/cases/${caseId}/appointments/new?error=${encodeURIComponent("บันทึกนัดหมายไม่สำเร็จ กรุณาลองอีกครั้ง")}`);
  }

  if (activeAppointment?.status === "reschedule_requested") {
    await supabase
      .from("appointment_participants")
      .update({ status: "confirmed", confirmed_at: now, note: "ลูกหนี้เลือกเวลานัดใหม่", profile_id: debtor.id })
      .eq("appointment_id", appointment.id)
      .eq("role", "debtor");
    await supabase
      .from("appointment_participants")
      .update({ status: "pending", confirmed_at: null, note: null, profile_id: currentCase.assigned_mediator_id })
      .eq("appointment_id", appointment.id)
      .eq("role", "mediator");
    await supabase
      .from("appointment_participants")
      .update({ status: "pending", confirmed_at: null, note: null, profile_id: creditorOfficer?.user_id ?? null })
      .eq("appointment_id", appointment.id)
      .eq("role", "creditor_officer");
  } else {
    await supabase.from("appointment_participants").insert([
      {
        appointment_id: appointment.id,
        profile_id: debtor.id,
        role: "debtor",
        status: "confirmed",
        confirmed_at: now,
      },
      {
        appointment_id: appointment.id,
        profile_id: currentCase.assigned_mediator_id,
        role: "mediator",
        status: "pending",
      },
      {
        appointment_id: appointment.id,
        profile_id: creditorOfficer?.user_id ?? null,
        organization_id: currentCase.creditor_organization_id,
        role: "creditor_officer",
        status: "pending",
      },
    ]);
  }

  await recordAppointmentHistory(
    appointment.id,
    activeAppointment?.status ?? null,
    "pending_confirmation",
    debtor.id,
    activeAppointment?.status === "reschedule_requested" ? "ลูกหนี้เลือกเวลานัดหมายใหม่หลังมีคำขอเลื่อน" : "ลูกหนี้ส่งคำขอนัดหมาย",
  );

  const { data: updatedCase, error: updateCaseError } = await supabase
    .from("cases")
    .update({ status: "appointment_scheduling" })
    .eq("id", currentCase.id)
    .eq("debtor_user_id", debtor.id)
    .select("id")
    .maybeSingle();

  if (!updateCaseError && !updatedCase) {
    try {
      const admin = createAdminClient();
      await admin
        .from("cases")
        .update({ status: "appointment_scheduling" })
        .eq("id", currentCase.id)
        .eq("debtor_user_id", debtor.id);
    } catch {
      // Appointment is already saved; keep the booking flow successful even if case status lags behind.
    }
  }

  await supabase.from("case_status_history").insert({
    case_id: currentCase.id,
    from_status: currentCase.status,
    to_status: "appointment_scheduling",
    changed_by: debtor.id,
    note: activeAppointment?.status === "reschedule_requested" ? "ลูกหนี้เลือกช่วงเวลานัดใหม่หลังคำขอเลื่อนนัด" : "ลูกหนี้เลือกช่วงเวลานัดหมายไกล่เกลี่ย",
  });

  await notifyAppointmentRequested({ appointmentId: appointment.id, caseId: currentCase.id, status: "pending_confirmation" });
  redirect(`/debtor/cases/${caseId}/appointments/${appointment.id}?success=${encodeURIComponent(activeAppointment?.status === "reschedule_requested" ? "เลือกเวลานัดใหม่แล้ว รอทุกฝ่ายยืนยันอีกครั้ง" : "ส่งคำขอนัดหมายแล้ว")}`);
}

export async function requestDebtorAppointmentReschedule(formData: FormData) {
  const debtor = await requireRole("debtor");
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const note = String(formData.get("note") ?? "").trim() || "ลูกหนี้ขอเลื่อนนัดหมาย";

  if (!appointmentId || !caseId) {
    redirect(`/debtor/appointments?error=${encodeURIComponent("ไม่พบนัดหมายที่ต้องการขอเลื่อน")}`);
  }

  const supabase = await createClient();
  const { data: appointment } = await supabase
    .from("mediation_appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("case_id", caseId)
    .eq("debtor_user_id", debtor.id)
    .maybeSingle();

  if (!appointment) {
    redirect(`/debtor/cases/${caseId}?error=${encodeURIComponent("ไม่พบนัดหมายของคุณ")}`);
  }

  if (appointment.status === "completed" || appointment.status === "cancelled") {
    redirect(`/debtor/cases/${caseId}/appointments/${appointmentId}?error=${encodeURIComponent("นัดหมายนี้ไม่สามารถขอเลื่อนได้แล้ว")}`);
  }

  const { error } = await requestAppointmentReschedule({
    appointment,
    actorId: debtor.id,
    actorRole: "debtor",
    note,
  });

  if (error) {
    redirect(`/debtor/cases/${caseId}/appointments/${appointmentId}?error=${encodeURIComponent("ขอเลื่อนนัดหมายไม่สำเร็จ")}`);
  }

  await notifyRescheduleRequested({ appointmentId, caseId, status: "reschedule_requested" });
  redirect(`/debtor/cases/${caseId}?success=${encodeURIComponent("ส่งคำขอเลื่อนนัดแล้ว กรุณาเลือกเวลานัดหมายใหม่")}`);
}
