import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { BillingInvoiceStatus, Database, MediationResultStatus, PaymentFrequency } from "@/types/database";

export type FeeSettings = Database["public"]["Tables"]["fee_settings"]["Row"];
export type ClosingRecord = Database["public"]["Tables"]["mediation_closing_records"]["Row"];
export type PaymentPlan = Database["public"]["Tables"]["settlement_payment_plans"]["Row"];
export type SettlementDocument = Database["public"]["Tables"]["settlement_documents"]["Row"];
export type BillingInvoice = Database["public"]["Tables"]["billing_invoices"]["Row"];
export type BillingInvoiceItem = Database["public"]["Tables"]["billing_invoice_items"]["Row"];

export type InvoiceWithDetails = BillingInvoice & {
  cases?: Database["public"]["Tables"]["cases"]["Row"] | null;
  creditor_organizations?: Database["public"]["Tables"]["creditor_organizations"]["Row"] | null;
  billing_invoice_items?: BillingInvoiceItem[] | null;
};

export const resultStatusLabels: Record<MediationResultStatus, string> = {
  settled: "ไกล่เกลี่ยสำเร็จ",
  not_settled: "ไกล่เกลี่ยไม่สำเร็จ",
};

export const invoiceStatusLabels: Record<BillingInvoiceStatus, string> = {
  draft: "ร่าง",
  issued: "ออกใบแจ้งหนี้แล้ว",
  sent: "ส่งแล้ว",
  paid: "ชำระแล้ว",
  overdue: "ค้างชำระ",
  cancelled: "ยกเลิก",
};

export const paymentFrequencyLabels: Record<PaymentFrequency, string> = {
  monthly: "รายเดือน",
  biweekly: "ทุกสองสัปดาห์",
  weekly: "รายสัปดาห์",
  custom: "กำหนดเอง",
};

export function money(value: number | null | undefined, currency = "THB") {
  return `${Number(value ?? 0).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function calculateFees(input: {
  resultStatus: MediationResultStatus;
  originalDebtAmount: number;
  settledAmount?: number | null;
  platformFeePercent: number;
  successFeePercent: number;
  vatPercent: number;
}) {
  const platformFeeAmount = input.originalDebtAmount * input.platformFeePercent / 100;
  const successFeeAmount = input.resultStatus === "settled" ? Number(input.settledAmount ?? 0) * input.successFeePercent / 100 : 0;
  const totalBeforeVat = platformFeeAmount + successFeeAmount;
  const vatAmount = totalBeforeVat * input.vatPercent / 100;
  return {
    platformFeeAmount,
    successFeeAmount,
    vatAmount,
    totalAmount: totalBeforeVat + vatAmount,
  };
}

export async function getFeeSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("fee_settings").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle();
  if (data) return data;
  return {
    id: "default",
    platform_fee_percent: 3,
    success_fee_percent: 10,
    currency: "THB",
    vat_percent: 0,
    invoice_prefix: "NTINV",
    payment_due_days: 15,
    bank_account_name: null,
    bank_account_number: null,
    bank_name: null,
    fee_policy_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } satisfies FeeSettings;
}

export function invoiceNumber(prefix: string) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `${prefix}-${stamp}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

export async function logEmail(input: {
  caseId: string;
  recipientEmail?: string | null;
  recipientRole: string;
  subject: string;
  templateName: string;
  status?: "queued" | "sent" | "failed";
  errorMessage?: string | null;
}) {
  const supabase = await createClient();
  await supabase.from("email_logs").insert({
    case_id: input.caseId,
    recipient_email: input.recipientEmail ?? null,
    recipient_role: input.recipientRole,
    subject: input.subject,
    template_name: input.templateName,
    status: input.status ?? "queued",
    error_message: input.errorMessage ?? null,
    sent_at: input.status === "sent" ? new Date().toISOString() : null,
  });
}

export async function queueClosingEmails(input: {
  caseId: string;
  caseNumber: string;
  resultStatus: MediationResultStatus;
  summary?: string | null;
  documentUrl: string;
  invoiceUrl?: string | null;
}) {
  const settled = input.resultStatus === "settled";
  await Promise.all([
    logEmail({ caseId: input.caseId, recipientRole: "debtor", subject: `ผลการไกล่เกลี่ยเคส ${input.caseNumber}`, templateName: settled ? "settlement_success_to_debtor" : "settlement_failed_to_debtor" }),
    logEmail({ caseId: input.caseId, recipientRole: "creditor", subject: `ผลการไกล่เกลี่ยเคส ${input.caseNumber}`, templateName: settled ? "settlement_success_to_creditor" : "settlement_failed_to_creditor" }),
    logEmail({ caseId: input.caseId, recipientRole: "mediator", subject: `บันทึกผลการไกล่เกลี่ยเคส ${input.caseNumber}`, templateName: settled ? "settlement_success_to_mediator" : "settlement_failed_to_mediator" }),
    logEmail({ caseId: input.caseId, recipientRole: "creditor", subject: `ใบแจ้งหนี้ค่าบริการแพลตฟอร์ม เคส ${input.caseNumber}`, templateName: "invoice_to_creditor" }),
  ]);
  // TODO: Wire queued email logs to a production email provider.
}

export function settlementDocumentUrl(documentId: string) {
  return `/documents/settlements/${documentId}`;
}

export function invoiceDocumentUrl(invoiceId: string) {
  return `/documents/invoices/${invoiceId}`;
}

export async function getClosingDetail(closingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_closing_records")
    .select("*, cases(*), settlement_payment_plans(*), settlement_documents(*), billing_invoices(*), mediator_profiles(*), creditor_organizations(*)")
    .eq("id", closingId)
    .maybeSingle();
  if (!data) notFound();
  return data as unknown as ClosingRecord & {
    cases?: Database["public"]["Tables"]["cases"]["Row"] | null;
    settlement_payment_plans?: PaymentPlan[] | null;
    settlement_documents?: SettlementDocument[] | null;
    billing_invoices?: BillingInvoice[] | null;
    mediator_profiles?: Database["public"]["Tables"]["mediator_profiles"]["Row"] | null;
    creditor_organizations?: Database["public"]["Tables"]["creditor_organizations"]["Row"] | null;
  };
}

export async function getSettlementDocument(documentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("settlement_documents")
    .select("*, mediation_closing_records(*, cases(*), settlement_payment_plans(*), mediator_profiles(*), creditor_organizations(*))")
    .eq("id", documentId)
    .maybeSingle();
  if (!data) notFound();
  return data as unknown as SettlementDocument & {
    mediation_closing_records: Awaited<ReturnType<typeof getClosingDetail>>;
  };
}

export async function getInvoice(invoiceId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("billing_invoices")
    .select("*, cases(*), creditor_organizations(*), billing_invoice_items(*)")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!data) notFound();
  return data as unknown as InvoiceWithDetails;
}

export async function listAdminInvoices(filters?: { status?: BillingInvoiceStatus; creditor?: string; date?: string; page?: number; pageSize?: number }) {
  const supabase = await createClient();
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.max(1, filters?.pageSize ?? 10);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("billing_invoices")
    .select("*, cases(*), creditor_organizations(*), billing_invoice_items(*)", { count: "exact" })
    .order("issued_at", { ascending: false })
    .range(from, to);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.creditor) query = query.eq("creditor_organization_id", filters.creditor);
  if (filters?.date) query = query.gte("issued_at", `${filters.date}T00:00:00`).lt("issued_at", `${filters.date}T23:59:59`);
  const { data, count, error } = await query;
  return {
    invoices: (data ?? []) as unknown as InvoiceWithDetails[],
    total: count ?? 0,
    error: error?.message ?? null,
  };
}

export async function listCreditorInvoices(organizationId?: string | null) {
  if (!organizationId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("billing_invoices")
    .select("*, cases(*), creditor_organizations(*), billing_invoice_items(*)")
    .eq("creditor_organization_id", organizationId)
    .order("issued_at", { ascending: false });
  return (data ?? []) as unknown as InvoiceWithDetails[];
}

export async function getClosingForCase(caseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediation_closing_records")
    .select("*, settlement_payment_plans(*), settlement_documents(*), billing_invoices(*)")
    .eq("case_id", caseId)
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as unknown as (ClosingRecord & {
    settlement_payment_plans?: PaymentPlan[] | null;
    settlement_documents?: SettlementDocument[] | null;
    billing_invoices?: BillingInvoice[] | null;
  }) | null;
}
