"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { getCreditorOfficer } from "@/lib/creditor";
import { createClient } from "@/lib/supabase/server";
import type { CreditorResponseStatus } from "@/types/database";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function registerCreditorOrganization(formData: FormData) {
  const profile = await requireRole("creditor");
  const organizationName = String(formData.get("organization_name") ?? "").trim();
  const organizationType = String(formData.get("organization_type") ?? "").trim();
  const taxId = String(formData.get("tax_id") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

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

export async function submitCreditorResponse(formData: FormData) {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  const caseId = String(formData.get("case_id") ?? "");
  const response = String(formData.get("response") ?? "") as CreditorResponseStatus;
  const reason = String(formData.get("reason") ?? "").trim();
  const requestedInformation = String(formData.get("requested_information") ?? "").trim();
  const proposedTerms = String(formData.get("proposed_terms") ?? "").trim();
  const settlementAmountRaw = String(formData.get("settlement_amount") ?? "").trim();
  const monthlyPaymentRaw = String(formData.get("monthly_payment") ?? "").trim();
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
  const { error } = await supabase.from("case_creditor_responses").insert({
    case_id: caseId,
    organization_id: officer.organization_id,
    officer_id: officer.id,
    response,
    reason: reason || null,
    requested_information: requestedInformation || null,
    proposed_terms: proposedTerms || null,
    settlement_amount: typeof settlementAmount === "number" && Number.isFinite(settlementAmount) ? settlementAmount : null,
    monthly_payment: typeof monthlyPayment === "number" && Number.isFinite(monthlyPayment) ? monthlyPayment : null,
  });

  if (error) {
    redirectWithError(`/creditor/cases/${caseId}`, "บันทึกการตอบกลับไม่สำเร็จ");
  }

  redirect(`/creditor/cases/${caseId}?success=${encodeURIComponent("บันทึกการตอบกลับแล้ว")}`);
}

async function updateCreditorCase(formData: FormData, response: CreditorResponseStatus, nextStatus: "creditor_accepted" | "creditor_rejected" | "needs_more_info", defaultMessage: string) {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  const caseId = String(formData.get("case_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!officer?.organization_id || !caseId) {
    redirectWithError("/creditor", "ไม่พบองค์กรเจ้าหนี้หรือเคสที่ต้องการดำเนินการ");
  }

  const supabase = await createClient();
  const { data: currentCase } = await supabase
    .from("cases")
    .select("status, creditor_organization_id")
    .eq("id", caseId)
    .eq("creditor_organization_id", officer.organization_id)
    .maybeSingle();

  if (!currentCase) {
    redirectWithError("/creditor", "ไม่พบเคสที่เชื่อมกับองค์กรนี้");
  }

  const { error } = await supabase
    .from("cases")
    .update({
      status: nextStatus,
      creditor_response_note: note || defaultMessage,
      rejection_reason: nextStatus === "creditor_rejected" ? note || defaultMessage : null,
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

  await supabase.from("case_status_history").insert({
    case_id: caseId,
    from_status: currentCase.status,
    to_status: nextStatus,
    note: note || defaultMessage,
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
