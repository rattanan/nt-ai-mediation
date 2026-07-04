"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { logEmail } from "@/lib/closing";
import { createClient } from "@/lib/supabase/server";

async function updateInvoiceStatus(formData: FormData, status: "paid" | "cancelled") {
  await requireRole("admin");
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const supabase = await createClient();
  const { error } = await supabase
    .from("billing_invoices")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", invoiceId);
  if (error) redirect(`/admin/billing?error=${encodeURIComponent("อัปเดตใบแจ้งหนี้ไม่สำเร็จ")}`);
  redirect(`/admin/billing?success=${encodeURIComponent("อัปเดตใบแจ้งหนี้แล้ว")}`);
}

export async function markInvoicePaid(formData: FormData) {
  await updateInvoiceStatus(formData, "paid");
}

export async function cancelInvoice(formData: FormData) {
  await updateInvoiceStatus(formData, "cancelled");
}

export async function resendInvoiceEmail(formData: FormData) {
  await requireRole("admin");
  const invoiceId = String(formData.get("invoice_id") ?? "");
  const caseId = String(formData.get("case_id") ?? "");
  await logEmail({
    caseId,
    recipientRole: "creditor",
    subject: "ส่งใบแจ้งหนี้ค่าบริการแพลตฟอร์มอีกครั้ง",
    templateName: "invoice_to_creditor",
  });
  redirect(`/admin/billing?success=${encodeURIComponent(`บันทึกคิวส่งอีเมลใบแจ้งหนี้ ${invoiceId} แล้ว`)}`);
}
