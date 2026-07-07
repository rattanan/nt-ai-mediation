"use server";

import { redirect } from "next/navigation";
import {
  calculateFees,
  getFeeSettings,
  invoiceDocumentUrl,
  invoiceNumber,
  queueClosingEmails,
  settlementDocumentPageUrl,
  settlementDocumentUrl,
} from "@/lib/closing";
import { requireRole } from "@/lib/auth/server";
import { getMediatorProfileByUser } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";
import { recalculateMediatorTrustScore } from "@/lib/trust-score";
import type { MediationResultStatus, PaymentFrequency } from "@/types/database";

function numberField(formData: FormData, name: string) {
  const value = Number(String(formData.get(name) ?? "").replaceAll(",", ""));
  return Number.isFinite(value) ? value : 0;
}

function textField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function closeMediationCase(formData: FormData) {
  const profile = await requireRole("mediator");
  const mediator = await getMediatorProfileByUser(profile.id);
  if (!mediator || mediator.status !== "approved") redirect("/mediator?error=โปรไฟล์ผู้ไกล่เกลี่ยยังไม่พร้อมใช้งาน");

  const caseId = textField(formData, "case_id");
  const appointmentId = textField(formData, "appointment_id") || null;
  const resultStatus = textField(formData, "result_status") as MediationResultStatus;
  const originalDebtAmount = numberField(formData, "original_debt_amount");
  const settledAmount = resultStatus === "settled" ? numberField(formData, "settled_amount") : null;
  const settlementSummary = textField(formData, "settlement_summary");
  const unsuccessfulReason = textField(formData, "unsuccessful_reason");
  const mediatorNote = textField(formData, "mediator_note");

  if (!caseId || !["settled", "not_settled"].includes(resultStatus) || originalDebtAmount <= 0) {
    redirect("/mediator?error=กรุณากรอกข้อมูลปิดเคสให้ครบถ้วน");
  }
  if (resultStatus === "settled" && (!settledAmount || settledAmount <= 0 || !settlementSummary)) {
    redirect(`/mediator/closing/${caseId}?appointment=${appointmentId ?? ""}&error=กรุณากรอกยอดตกลงและสรุปข้อตกลง`);
  }
  if (resultStatus === "not_settled" && !unsuccessfulReason) {
    redirect(`/mediator/closing/${caseId}?appointment=${appointmentId ?? ""}&error=กรุณาระบุเหตุผลที่ไกล่เกลี่ยไม่สำเร็จ`);
  }

  const supabase = await createClient();
  const { data: currentCase } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("selected_mediator_profile_id", mediator.id)
    .maybeSingle();
  if (!currentCase) redirect("/mediator?error=ไม่พบเคสที่คุณได้รับมอบหมาย");

  const { data: closing, error: closingError } = await supabase
    .from("mediation_closing_records")
    .insert({
      case_id: caseId,
      appointment_id: appointmentId,
      mediator_id: mediator.id,
      debtor_user_id: currentCase.debtor_user_id,
      creditor_organization_id: currentCase.creditor_organization_id,
      result_status: resultStatus,
      original_debt_amount: originalDebtAmount,
      settled_amount: settledAmount,
      settlement_summary: settlementSummary || null,
      unsuccessful_reason: unsuccessfulReason || null,
      mediator_note: mediatorNote || null,
    })
    .select()
    .single();
  if (closingError || !closing) {
    console.error("Closing record insert failed", closingError);
    redirect(`/mediator/closing/${caseId}?appointment=${appointmentId ?? ""}&error=บันทึกผลการไกล่เกลี่ยไม่สำเร็จ`);
  }

  if (resultStatus === "settled") {
    await supabase.from("settlement_payment_plans").insert({
      closing_record_id: closing.id,
      case_id: caseId,
      total_settlement_amount: settledAmount ?? 0,
      down_payment_amount: numberField(formData, "down_payment_amount"),
      installment_amount: numberField(formData, "installment_amount"),
      number_of_installments: Math.max(1, Math.round(numberField(formData, "number_of_installments") || 1)),
      first_payment_due_date: textField(formData, "first_payment_due_date") || null,
      payment_frequency: (textField(formData, "payment_frequency") || "monthly") as PaymentFrequency,
      payment_method: textField(formData, "payment_method") || null,
      special_terms: textField(formData, "special_terms") || null,
    });
  }

  const documentType = resultStatus === "settled" ? "settlement_agreement" : "unsuccessful_closing_report";
  const { data: document } = await supabase
    .from("settlement_documents")
    .insert({ closing_record_id: closing.id, case_id: caseId, document_type: documentType })
    .select()
    .single();
  if (document) {
    await supabase.from("settlement_documents").update({ pdf_url: settlementDocumentUrl(document.id) }).eq("id", document.id);
  }

  const feeSettings = await getFeeSettings();
  const fees = calculateFees({
    resultStatus,
    originalDebtAmount,
    settledAmount,
    platformFeePercent: feeSettings.platform_fee_percent,
    successFeePercent: feeSettings.success_fee_percent,
    vatPercent: feeSettings.vat_percent,
  });
  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + feeSettings.payment_due_days);
  const invoiceId = crypto.randomUUID();

  const { data: invoice, error: invoiceError } = await supabase
    .from("billing_invoices")
    .insert({
      id: invoiceId,
      invoice_number: invoiceNumber(feeSettings.invoice_prefix),
      case_id: caseId,
      closing_record_id: closing.id,
      creditor_organization_id: currentCase.creditor_organization_id,
      original_debt_amount: originalDebtAmount,
      settled_amount: settledAmount,
      platform_fee_percent: feeSettings.platform_fee_percent,
      platform_fee_amount: fees.platformFeeAmount,
      success_fee_percent: resultStatus === "settled" ? feeSettings.success_fee_percent : 0,
      success_fee_amount: fees.successFeeAmount,
      vat_percent: feeSettings.vat_percent,
      vat_amount: fees.vatAmount,
      total_amount: fees.totalAmount,
      status: "sent",
      due_at: dueAt.toISOString(),
      pdf_url: invoiceDocumentUrl(invoiceId),
    })
    .select()
    .single();

  if (invoiceError || !invoice) {
    console.error("Billing invoice insert failed", invoiceError);
    redirect(`/mediator/closing/${caseId}?appointment=${appointmentId ?? ""}&error=สร้างใบแจ้งหนี้ให้เจ้าหนี้ไม่สำเร็จ`);
  }

  const { error: invoiceItemsError } = await supabase.from("billing_invoice_items").insert([
    { invoice_id: invoice.id, item_name: "Platform Fee", description: "ค่าบริการแพลตฟอร์ม", calculation_base_amount: originalDebtAmount, fee_percent: feeSettings.platform_fee_percent, amount: fees.platformFeeAmount },
    { invoice_id: invoice.id, item_name: "Success Fee", description: "ค่าความสำเร็จเมื่อไกล่เกลี่ยสำเร็จ", calculation_base_amount: settledAmount ?? 0, fee_percent: resultStatus === "settled" ? feeSettings.success_fee_percent : 0, amount: fees.successFeeAmount },
  ]);

  if (invoiceItemsError) {
    console.error("Billing invoice items insert failed", invoiceItemsError);
    redirect(`/mediator/closing/${caseId}?appointment=${appointmentId ?? ""}&error=สร้างรายการค่าบริการในใบแจ้งหนี้ไม่สำเร็จ`);
  }

  const nextStatus = resultStatus === "settled" ? "settled" : "not_settled";
  await supabase.from("cases").update({ status: nextStatus }).eq("id", caseId);
  await supabase.from("mediator_profiles").update({
    total_cases_handled: mediator.total_cases_handled + 1,
    successful_cases: mediator.successful_cases + (resultStatus === "settled" ? 1 : 0),
  }).eq("id", mediator.id);
  await supabase.from("case_status_history").insert({
    case_id: caseId,
    from_status: currentCase.status,
    to_status: nextStatus,
    changed_by: profile.id,
    note: resultStatus === "settled" ? "ผู้ไกล่เกลี่ยบันทึกผลสำเร็จและข้อตกลง" : "ผู้ไกล่เกลี่ยบันทึกผลไม่สำเร็จ",
  });

  await queueClosingEmails({
    caseId,
    caseNumber: currentCase.case_number,
    resultStatus,
    summary: settlementSummary || unsuccessfulReason,
    documentUrl: document ? settlementDocumentPageUrl(document.id) : "",
    invoiceUrl: invoice ? invoiceDocumentUrl(invoice.id) : null,
  });
  await recalculateMediatorTrustScore(mediator.id);

  redirect(`/mediator/closing/${caseId}/success?closing=${closing.id}`);
}
