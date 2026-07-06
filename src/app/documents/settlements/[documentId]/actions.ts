"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { getCreditorOfficer } from "@/lib/creditor";
import { getMediatorProfileByUser } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

function textField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function redirectWithMessage(documentId: string, messageType: "success" | "error", message: string) {
  const params = new URLSearchParams();
  params.set(messageType, message);
  redirect(`/documents/settlements/${documentId}?${params.toString()}`);
}

export async function signSettlementDocument(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const documentId = textField(formData, "document_id");
  const caseId = textField(formData, "case_id");
  const signerRole = textField(formData, "signer_role");
  const signerName = textField(formData, "signer_name") || profile.full_name;

  if (!documentId || !caseId || !["debtor", "creditor", "mediator"].includes(signerRole)) {
    redirectWithMessage(documentId || caseId, "error", "ข้อมูลการลงนามไม่ครบถ้วน");
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("settlement_documents")
    .select("id, case_id, closing_record_id")
    .eq("id", documentId)
    .maybeSingle();

  if (!document) {
    redirectWithMessage(documentId, "error", "ไม่พบเอกสาร");
    return;
  }

  const { data: closing } = await supabase
    .from("mediation_closing_records")
    .select("id, case_id, debtor_user_id, creditor_organization_id, mediator_id")
    .eq("id", document.closing_record_id)
    .maybeSingle();
  if (!closing || document.case_id !== caseId) {
    redirectWithMessage(documentId, "error", "ไม่พบข้อมูลที่ตรงกัน");
    return;
  }

  const creditorOfficer = signerRole === "creditor" ? await getCreditorOfficer(profile.id) : null;
  const mediatorProfile = signerRole === "mediator" ? await getMediatorProfileByUser(profile.id) : null;

  const isDebtor = signerRole === "debtor" && closing.debtor_user_id === profile.id;
  const isCreditor = signerRole === "creditor" && profile.role === "creditor" && creditorOfficer?.organization_id === closing.creditor_organization_id;
  const isMediator = signerRole === "mediator" && profile.role === "mediator" && mediatorProfile?.id === closing.mediator_id;
  if (!isDebtor && !isCreditor && !isMediator) {
    redirectWithMessage(documentId, "error", "คุณไม่มีสิทธิ์ลงนามเอกสารนี้");
    return;
  }

  const { error } = await supabase.from("settlement_document_signatures").upsert(
    {
      document_id: documentId,
      case_id: caseId,
      signer_role: signerRole as "debtor" | "creditor" | "mediator",
      signer_user_id: profile.id,
      signer_name: signerName,
      signed_at: new Date().toISOString(),
    },
    { onConflict: "document_id,signer_role" },
  );

  if (error) {
    redirectWithMessage(documentId, "error", "ลงนามไม่สำเร็จ");
    return;
  }

  redirectWithMessage(documentId, "success", "ลงนามเรียบร้อยแล้ว");
}
