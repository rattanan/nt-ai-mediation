import "server-only";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type CompletionCertificate = Database["public"]["Tables"]["case_completion_certificates"]["Row"];
type CertificateClosing = Database["public"]["Tables"]["mediation_closing_records"]["Row"] & {
  cases?: Database["public"]["Tables"]["cases"]["Row"] | null;
  mediator_profiles?: Database["public"]["Tables"]["mediator_profiles"]["Row"] | null;
  creditor_organizations?: Database["public"]["Tables"]["creditor_organizations"]["Row"] | null;
  settlement_payment_plans?: Database["public"]["Tables"]["settlement_payment_plans"]["Row"][] | null;
};

function certificateNumber(caseNumber: string) {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = crypto.randomUUID().slice(0, 6).toUpperCase();
  return `NT-CERT-${stamp}-${caseNumber.replace(/[^A-Za-z0-9]/g, "").slice(-6)}-${suffix}`;
}

export async function getOrCreateCompletionCertificate(caseId: string) {
  const supabase = await createClient();
  const { data: closing } = await supabase
    .from("mediation_closing_records")
    .select("*, cases(*), mediator_profiles(*), creditor_organizations(*), settlement_payment_plans(*)")
    .eq("case_id", caseId)
    .eq("result_status", "settled")
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!closing) notFound();

  const typedClosing = closing as unknown as CertificateClosing;
  const item = typedClosing.cases;
  if (!item) notFound();

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("case_completion_certificates")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  if (existing) {
    return { certificate: existing, closing: typedClosing };
  }

  const { data: certificate, error } = await admin
    .from("case_completion_certificates")
    .insert({
      case_id: caseId,
      closing_record_id: typedClosing.id,
      certificate_number: certificateNumber(item.case_number),
      issued_to_user_id: typedClosing.debtor_user_id,
      mediator_id: typedClosing.mediator_id,
    })
    .select("*")
    .single();

  if (error || !certificate) {
    console.error("Completion certificate create failed", error);
    notFound();
  }

  return { certificate, closing: typedClosing };
}
