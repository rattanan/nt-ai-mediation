"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "@/lib/auth/server";
import { getCreditorOfficer } from "@/lib/creditor";
import { getMediatorProfileByUser } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";
import type { SettlementDocumentSignatureRole } from "@/types/database";

function textField(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function isValidPngDataUrl(value: string) {
  if (!value.startsWith("data:image/png;base64,") || value.length > 300000) return false;
  try {
    const bytes = Buffer.from(value.slice("data:image/png;base64,".length), "base64");
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  } catch {
    return false;
  }
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
  const signatureImageData = textField(formData, "signature_image_data");

  if (!documentId || !caseId || !["debtor", "creditor", "mediator"].includes(signerRole)) {
    redirectWithMessage(documentId || caseId, "error", "ข้อมูลการลงนามไม่ครบถ้วน");
  }
  if (!isValidPngDataUrl(signatureImageData)) {
    redirectWithMessage(documentId, "error", "กรุณาวาดลายเซ็นในช่องลงนาม");
  }

  const supabase = await createClient();
  const { data: document } = await supabase
    .from("settlement_documents")
    .select("id, case_id, closing_record_id, document_type")
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

  const { data: existingSignature } = await supabase
    .from("settlement_document_signatures")
    .select("id, signer_user_id")
    .eq("document_id", documentId)
    .eq("signer_role", signerRole as "debtor" | "creditor" | "mediator")
    .maybeSingle();

  if (existingSignature) {
    redirectWithMessage(
      documentId,
      existingSignature.signer_user_id === profile.id ? "success" : "error",
      existingSignature.signer_user_id === profile.id ? "คุณลงนามเอกสารนี้เรียบร้อยแล้ว" : "เอกสารนี้มีผู้ลงนามในบทบาทดังกล่าวแล้ว",
    );
  }

  const { error } = await supabase.from("settlement_document_signatures").insert({
    document_id: documentId,
    case_id: caseId,
    signer_role: signerRole as "debtor" | "creditor" | "mediator",
    signer_user_id: profile.id,
    signer_name: signerName,
    signature_image_data: signatureImageData,
    signed_at: new Date().toISOString(),
  });

  if (error) {
    if (error.code === "23505") {
      redirectWithMessage(documentId, "success", "ลงนามเรียบร้อยแล้ว");
    }
    console.error("Settlement signature insert failed", { documentId, caseId, signerRole, code: error.code, message: error.message });
    redirectWithMessage(documentId, "error", "ลงนามไม่สำเร็จ");
  }

  const { data: signatures } = await supabase
    .from("settlement_document_signatures")
    .select("signer_role")
    .eq("document_id", documentId);

  const requiredRoles: SettlementDocumentSignatureRole[] = ["debtor", "creditor", "mediator"];
  const signedRoles = new Set<SettlementDocumentSignatureRole>((signatures ?? []).map((signature) => signature.signer_role));
  const allPartiesSigned = requiredRoles.every((role) => signedRoles.has(role));

  if (allPartiesSigned && document.document_type === "settlement_agreement") {
    const { data: currentCase } = await supabase.from("cases").select("status").eq("id", caseId).maybeSingle();
    if (currentCase && currentCase.status !== "closed") {
      const { error: closeError } = await supabase.from("cases").update({ status: "closed" }).eq("id", caseId);
      if (!closeError) {
        await supabase.from("case_status_history").insert({
          case_id: caseId,
          from_status: currentCase.status,
          to_status: "closed",
          changed_by: profile.id,
          note: "ทุกฝ่ายลงนามบันทึกตกลงข้อพิพาทครบถ้วนแล้ว ระบบปิดเคสอัตโนมัติ",
        });
        revalidatePath(`/debtor/cases/${caseId}`);
        revalidatePath(`/creditor/cases/${caseId}`);
        revalidatePath(`/documents/settlements/${documentId}`);
      }
    }
  }

  redirectWithMessage(documentId, "success", "ลงนามเรียบร้อยแล้ว");
}
