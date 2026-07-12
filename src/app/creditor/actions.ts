"use server";

import { redirect } from "next/navigation";
import { notifyAppointmentConfirmed, notifyRescheduleRequested } from "@/lib/appointment-notifications";
import { confirmAppointmentIfReady, recordAppointmentHistory, requestAppointmentReschedule } from "@/lib/appointments";
import { requireRole } from "@/lib/auth/server";
import { getCreditorOfficer } from "@/lib/creditor";
import { createClient } from "@/lib/supabase/server";
import type { CaseStatus, CreditorResponseStatus } from "@/types/database";

const CREDITOR_LOGOS_BUCKET = "creditor-logos";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

async function uploadCreditorLogo(file: FormDataEntryValue | null, userId: string) {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    redirectWithError("/creditor/organization", "กรุณาอัปโหลดไฟล์รูปภาพสำหรับโลโก้");
  }
  if (file.size > 2 * 1024 * 1024) {
    redirectWithError("/creditor/organization", "โลโก้ต้องมีขนาดไม่เกิน 2MB");
  }

  const supabase = await createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "png";
  const path = `${userId}/logo-${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(CREDITOR_LOGOS_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: true,
  });

  if (error) {
    console.error("Creditor logo upload failed", error);
    redirectWithError("/creditor/organization", "อัปโหลดโลโก้ไม่สำเร็จ");
  }

  const { data } = supabase.storage.from(CREDITOR_LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function registerCreditorOrganization(formData: FormData) {
  const profile = await requireRole("creditor");
  const organizationName = String(formData.get("organization_name") ?? "").trim();
  const organizationType = String(formData.get("organization_type") ?? "").trim();
  const taxId = String(formData.get("tax_id") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const logoUrl = await uploadCreditorLogo(formData.get("logo_file"), profile.id);

  if (!organizationName || !organizationType) {
    redirectWithError("/creditor/organization", "กรุณากรอกชื่อองค์กรและประเภทองค์กร");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("creditor_organizations")
    .insert({
      organization_name: organizationName,
      organization_type: organizationType,
      tax_id: taxId || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      address: address || null,
      logo_url: logoUrl,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    redirectWithError("/creditor/organization", "ส่งคำขอสมัครองค์กรไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  const [firstName, ...lastParts] = profile.full_name.split(" ");
  await supabase.from("creditor_officers").insert({
    user_id: profile.id,
    organization_id: data.id,
    first_name: firstName || profile.full_name,
    last_name: lastParts.join(" ") || "-",
    email: contactEmail || null,
    mobile: contactPhone || null,
    position: "ผู้ดูแลองค์กร",
    role: "creditor_admin",
    status: "active",
  });

  redirect(`/creditor?success=${encodeURIComponent("ส่งคำขอสมัครองค์กรแล้ว รอผู้ดูแลระบบอนุมัติ")}`);
}

export async function updateCreditorOrganizationLogo(formData: FormData) {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  if (!officer?.organization_id) {
    redirectWithError("/creditor/organization", "ไม่พบองค์กรเจ้าหนี้");
  }

  const logoUrl = await uploadCreditorLogo(formData.get("logo_file"), profile.id);
  if (!logoUrl) {
    redirectWithError("/creditor/organization", "กรุณาเลือกไฟล์โลโก้");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("creditor_organizations")
    .update({ logo_url: logoUrl })
    .eq("id", officer.organization_id);

  if (error) {
    redirectWithError("/creditor/organization", "บันทึกโลโก้ไม่สำเร็จ");
  }

  redirect(`/creditor/organization?success=${encodeURIComponent("อัปเดตโลโก้องค์กรแล้ว")}`);
}

export async function updateCreditorOrganizationInfo(formData: FormData) {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  if (!officer?.organization_id) {
    redirectWithError("/creditor/organization", "ไม่พบองค์กรเจ้าหนี้");
  }

  const organizationName = String(formData.get("organization_name") ?? "").trim();
  const organizationType = String(formData.get("organization_type") ?? "").trim();
  const taxId = String(formData.get("tax_id") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const shortName = String(formData.get("short_name") ?? "").trim();

  if (!organizationName || !organizationType) {
    redirectWithError("/creditor/organization", "กรุณากรอกชื่อองค์กรและประเภทองค์กร");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("creditor_organizations")
    .update({
      organization_name: organizationName,
      organization_type: organizationType,
      tax_id: taxId || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      address: address || null,
      website: website || null,
      short_name: shortName || null,
    })
    .eq("id", officer.organization_id)
    .eq("status", "pending");

  if (error) {
    redirectWithError("/creditor/organization", "บันทึกข้อมูลองค์กรไม่สำเร็จ");
  }

  redirect(`/creditor/organization?success=${encodeURIComponent("บันทึกข้อมูลองค์กรแล้ว")}`);
}

export async function submitCreditorResponse(formData: FormData) {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  const caseId = String(formData.get("case_id") ?? "");
  const response = String(formData.get("response") ?? "") as CreditorResponseStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  const requestedInformation = String(formData.get("requested_information") ?? "").trim();
  const proposedTerms = String(formData.get("proposed_terms") ?? "").trim();
  const discountAmountRaw = String(formData.get("discount_amount") ?? "").trim();
  const settlementAmountRaw = String(formData.get("settlement_amount") ?? "").trim();
  const monthlyPaymentRaw = String(formData.get("monthly_payment") ?? "").trim();
  const discountAmount = discountAmountRaw ? Number(discountAmountRaw) : null;
  const settlementAmount = settlementAmountRaw ? Number(settlementAmountRaw) : null;
  const monthlyPayment = monthlyPaymentRaw ? Number(monthlyPaymentRaw) : null;

  if (!officer?.organization_id || !caseId) {
    redirectWithError("/creditor", "ไม่พบองค์กรเจ้าหนี้หรือเคสที่ต้องการดำเนินการ");
  }

  const validResponses: CreditorResponseStatus[] = [
    "accepted",
    "rejected",
    "needs_more_info",
    "settlement_proposed",
    "settlement_approved",
  ];

  if (!validResponses.includes(response)) {
    redirectWithError(`/creditor/cases/${caseId}`, "ประเภทการตอบกลับไม่ถูกต้อง");
  }

  if (response === "rejected" && !reason) {
    redirectWithError(`/creditor/cases/${caseId}`, "กรุณาระบุเหตุผลในการปฏิเสธ");
  }

  const supabase = await createClient();
  const { data: currentCase } = await supabase
    .from("cases")
    .select("status")
    .eq("id", caseId)
    .eq("creditor_organization_id", officer.organization_id)
    .maybeSingle();
  const enrichedProposedTerms = [
    proposedTerms || null,
    typeof discountAmount === "number" && Number.isFinite(discountAmount)
      ? `ส่วนลดที่เสนอ ${discountAmount.toLocaleString("th-TH")} บาท`
      : null,
  ].filter(Boolean).join("\n") || null;

  const responsePayload = {
    case_id: caseId,
    organization_id: officer.organization_id,
    officer_id: officer.id,
    response,
    reason: reason || null,
    requested_information: requestedInformation || null,
    proposed_terms: enrichedProposedTerms,
    settlement_amount: typeof settlementAmount === "number" && Number.isFinite(settlementAmount) ? settlementAmount : null,
    monthly_payment: typeof monthlyPayment === "number" && Number.isFinite(monthlyPayment) ? monthlyPayment : null,
  };

  const { error } = await supabase.from("case_creditor_responses").insert(responsePayload);

  if (error) {
    console.error("Creditor response save failed", {
      caseId,
      organizationId: officer.organization_id,
      officerId: officer.id,
      response,
      error,
    });
    redirectWithError(`/creditor/cases/${caseId}`, "บันทึกการตอบกลับไม่สำเร็จ");
  }

  const settlementNote = [
    enrichedProposedTerms ? `ข้อเสนอ: ${enrichedProposedTerms}` : null,
    typeof settlementAmount === "number" && Number.isFinite(settlementAmount)
      ? `ยอดข้อตกลง ${settlementAmount.toLocaleString("th-TH")} บาท`
      : null,
    typeof monthlyPayment === "number" && Number.isFinite(monthlyPayment)
      ? `ผ่อนชำระ ${monthlyPayment.toLocaleString("th-TH")} บาท/เดือน`
      : null,
  ]
    .filter(Boolean)
    .join(" | ");

  await supabase
    .from("cases")
    .update({
      creditor_response_note: settlementNote || enrichedProposedTerms || requestedInformation || reason || "เจ้าหนี้ส่งคำตอบกลับแล้ว",
      rejection_reason: response === "rejected" ? reason || "เจ้าหนี้ปฏิเสธคำขอ" : null,
    })
    .eq("id", caseId)
    .eq("creditor_organization_id", officer.organization_id);

  if (currentCase) {
    await supabase.from("case_status_history").insert({
      case_id: caseId,
      from_status: currentCase.status,
      to_status: currentCase.status,
      changed_by: profile.id,
      note: settlementNote || enrichedProposedTerms || requestedInformation || reason || "เจ้าหนี้ส่งคำตอบกลับ",
    });
  }

  redirect(`/creditor/cases/${caseId}?success=${encodeURIComponent("บันทึกการตอบกลับแล้ว")}`);
}

async function updateCreditorCase(formData: FormData, response: CreditorResponseStatus, nextStatus: "creditor_accepted" | "creditor_rejected" | "needs_more_info", defaultMessage: string) {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  const caseId = String(formData.get("case_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const proposedTerms = String(formData.get("proposed_terms") ?? "").trim();
  const discountAmountRaw = String(formData.get("discount_amount") ?? "").trim();
  const settlementAmountRaw = String(formData.get("settlement_amount") ?? "").trim();
  const monthlyPaymentRaw = String(formData.get("monthly_payment") ?? "").trim();
  const discountAmount = discountAmountRaw ? Number(discountAmountRaw) : null;
  const settlementAmount = settlementAmountRaw ? Number(settlementAmountRaw) : null;
  const monthlyPayment = monthlyPaymentRaw ? Number(monthlyPaymentRaw) : null;

  if (!officer?.organization_id || !caseId) {
    redirectWithError("/creditor", "ไม่พบองค์กรเจ้าหนี้หรือเคสที่ต้องการดำเนินการ");
  }

  const supabase = await createClient();
  const { data: currentCase } = await supabase
    .from("cases")
    .select("status, creditor_organization_id, selected_mediator_profile_id")
    .eq("id", caseId)
    .eq("creditor_organization_id", officer.organization_id)
    .maybeSingle();

  if (!currentCase) {
    redirectWithError("/creditor", "ไม่พบเคสที่เชื่อมกับองค์กรนี้");
  }

  const resolvedNextStatus: CaseStatus = nextStatus === "creditor_accepted" && currentCase.selected_mediator_profile_id
    ? "mediator_selected"
    : nextStatus;

  const enrichedProposedTerms = [
    proposedTerms || null,
    typeof discountAmount === "number" && Number.isFinite(discountAmount)
      ? `ส่วนลดที่เสนอ ${discountAmount.toLocaleString("th-TH")} บาท`
      : null,
  ].filter(Boolean).join("\n") || null;

  const { error } = await supabase
    .from("cases")
    .update({
      status: resolvedNextStatus,
      creditor_response_note: [
        note || defaultMessage,
        enrichedProposedTerms ? `ข้อเสนอข้อตกลง: ${enrichedProposedTerms}` : null,
        typeof settlementAmount === "number" && Number.isFinite(settlementAmount)
          ? `ยอดข้อตกลง ${settlementAmount.toLocaleString("th-TH")} บาท`
          : null,
        typeof monthlyPayment === "number" && Number.isFinite(monthlyPayment)
          ? `ผ่อนชำระ ${monthlyPayment.toLocaleString("th-TH")} บาท/เดือน`
          : null,
      ]
        .filter(Boolean)
        .join(" | "),
      rejection_reason: resolvedNextStatus === "creditor_rejected" ? note || defaultMessage : null,
    })
    .eq("id", caseId)
    .eq("creditor_organization_id", officer.organization_id);

  if (error) {
    redirectWithError(`/creditor/cases/${caseId}`, "อัปเดตคำตอบเจ้าหนี้ไม่สำเร็จ");
  }

  await supabase.from("case_creditor_responses").insert({
    case_id: caseId,
    organization_id: officer.organization_id,
    officer_id: officer.id,
    response,
    reason: note || null,
  });

  if (enrichedProposedTerms || (typeof settlementAmount === "number" && Number.isFinite(settlementAmount)) || (typeof monthlyPayment === "number" && Number.isFinite(monthlyPayment))) {
    await supabase.from("case_creditor_responses").insert({
      case_id: caseId,
      organization_id: officer.organization_id,
      officer_id: officer.id,
      response: "settlement_proposed",
      proposed_terms: enrichedProposedTerms,
      settlement_amount: typeof settlementAmount === "number" && Number.isFinite(settlementAmount) ? settlementAmount : null,
      monthly_payment: typeof monthlyPayment === "number" && Number.isFinite(monthlyPayment) ? monthlyPayment : null,
    });
  }

  await supabase.from("case_status_history").insert({
    case_id: caseId,
    from_status: currentCase.status,
    to_status: resolvedNextStatus,
    note: [note || defaultMessage, currentCase.selected_mediator_profile_id && resolvedNextStatus === "mediator_selected" ? "ใช้ผู้ไกล่เกลี่ยที่ลูกหนี้เลือกไว้ล่วงหน้า" : null, enrichedProposedTerms].filter(Boolean).join(" | "),
  });

  redirect(`/creditor/cases/${caseId}?success=${encodeURIComponent("บันทึกการพิจารณาแล้ว")}`);
}

export async function acceptCreditorCase(formData: FormData) {
  await updateCreditorCase(formData, "accepted", "creditor_accepted", "เจ้าหนี้รับคำขอไกล่เกลี่ย");
}

export async function rejectCreditorCase(formData: FormData) {
  await updateCreditorCase(formData, "rejected", "creditor_rejected", "เจ้าหนี้ปฏิเสธคำขอไกล่เกลี่ย");
}

export async function requestCreditorMoreInfo(formData: FormData) {
  await updateCreditorCase(formData, "needs_more_info", "needs_more_info", "เจ้าหนี้ขอข้อมูลเพิ่มเติม");
}

export async function confirmCreditorAppointment(formData: FormData) {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!officer?.organization_id || !appointmentId || !caseId) {
    redirectWithError("/creditor", "ไม่พบนัดหมายที่ต้องการยืนยัน");
  }

  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: appointment } = await supabase
    .from("mediation_appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("creditor_organization_id", officer.organization_id)
    .maybeSingle();

  if (!appointment) {
    redirectWithError(`/creditor/cases/${caseId}`, "ไม่พบนัดหมายขององค์กรนี้");
  }

  const { error } = await supabase
    .from("mediation_appointments")
    .update({
      confirmed_by_creditor_at: now,
      creditor_officer_user_id: profile.id,
      status: appointment.status === "requested" ? "pending_confirmation" : appointment.status,
    })
    .eq("id", appointmentId);

  if (error) {
    redirectWithError(`/creditor/cases/${caseId}`, "ยืนยันนัดหมายไม่สำเร็จ");
  }

  await supabase
    .from("appointment_participants")
    .update({ status: "confirmed", confirmed_at: now, note: note || null, profile_id: profile.id })
    .eq("appointment_id", appointmentId)
    .eq("role", "creditor_officer");

  await recordAppointmentHistory(appointmentId, appointment.status, "pending_confirmation", profile.id, note || "เจ้าหนี้ยืนยันนัดหมาย");
  const confirmed = await confirmAppointmentIfReady(appointmentId, profile.id);

  if (confirmed?.status === "confirmed") {
    await notifyAppointmentConfirmed({ appointmentId, caseId, status: "confirmed" });
  }

  redirect(`/creditor/cases/${caseId}?success=${encodeURIComponent("ยืนยันนัดหมายแล้ว")}`);
}

export async function requestCreditorAppointmentReschedule(formData: FormData) {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  const note = String(formData.get("note") ?? "").trim() || "เจ้าหนี้ขอเลื่อนนัดหมาย";

  if (!officer?.organization_id || !appointmentId || !caseId) {
    redirectWithError("/creditor", "ไม่พบนัดหมายที่ต้องการขอเลื่อน");
  }

  const supabase = await createClient();
  const { data: appointment } = await supabase
    .from("mediation_appointments")
    .select("*")
    .eq("id", appointmentId)
    .eq("creditor_organization_id", officer.organization_id)
    .maybeSingle();

  if (!appointment) {
    redirectWithError(`/creditor/cases/${caseId}`, "ไม่พบนัดหมายขององค์กรนี้");
  }

  const { error } = await requestAppointmentReschedule({
    appointment,
    actorId: profile.id,
    actorRole: "creditor_officer",
    note,
  });

  if (error) {
    redirectWithError(`/creditor/cases/${caseId}`, "ขอเลื่อนนัดหมายไม่สำเร็จ");
  }

  await notifyRescheduleRequested({ appointmentId, caseId, status: "reschedule_requested" });
  redirect(`/creditor/cases/${caseId}?success=${encodeURIComponent("ส่งคำขอเลื่อนนัดหมายแล้ว")}`);
}
