"use server";

import { redirect } from "next/navigation";
import { notifyAppointmentRequested } from "@/lib/appointment-notifications";
import { getAvailableSlotsForCase, recordAppointmentHistory } from "@/lib/appointments";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor } from "@/lib/cases";
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

  const { data: appointment, error } = await supabase
    .from("mediation_appointments")
    .insert({
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
      status: "pending_confirmation",
      requested_by: debtor.id,
      confirmed_by_debtor_at: now,
    })
    .select()
    .single();

  if (error || !appointment) {
    redirect(`/debtor/cases/${caseId}/appointments/new?error=${encodeURIComponent("บันทึกนัดหมายไม่สำเร็จ กรุณาลองอีกครั้ง")}`);
  }

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

  await recordAppointmentHistory(appointment.id, null, "pending_confirmation", debtor.id, "ลูกหนี้ส่งคำขอนัดหมาย");

  await supabase
    .from("cases")
    .update({ status: "appointment_scheduling" })
    .eq("id", currentCase.id)
    .eq("debtor_user_id", debtor.id);

  await supabase.from("case_status_history").insert({
    case_id: currentCase.id,
    from_status: currentCase.status,
    to_status: "appointment_scheduling",
    changed_by: debtor.id,
    note: "ลูกหนี้เลือกช่วงเวลานัดหมายไกล่เกลี่ย",
  });

  await notifyAppointmentRequested({ appointmentId: appointment.id, caseId: currentCase.id, status: "pending_confirmation" });
  redirect(`/debtor/cases/${caseId}/appointments/${appointment.id}?success=${encodeURIComponent("ส่งคำขอนัดหมายแล้ว")}`);
}
