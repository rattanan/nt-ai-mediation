"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor, isEditableCase, parseCaseForm, type CaseFormState } from "@/lib/cases";
import { formError } from "@/lib/form-state";
import { createClient } from "@/lib/supabase/server";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

const CASE_DOCUMENTS_BUCKET = "case-documents";
const OCR_MIME_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

function safeFileName(name: string) {
  const cleaned = name.normalize("NFKD").replace(/[^\w.\-]+/g, "-").replace(/-+/g, "-");
  return cleaned || "document";
}

async function uploadCaseDocuments(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, formData: FormData) {
  const files = formData
    .getAll("documents")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  const uploadedDocuments: Array<{ name: string; path: string; size: number; type: string | null }> = [];

  if (files.some((file) => !OCR_MIME_TYPES.has(file.type))) {
    return { error: "รองรับเอกสาร PDF, JPEG และ PNG เท่านั้น", documents: uploadedDocuments };
  }
  if (files.some((file) => file.size > MAX_DOCUMENT_BYTES)) {
    return { error: "เอกสารแต่ละไฟล์ต้องมีขนาดไม่เกิน 20 MB", documents: uploadedDocuments };
  }

  for (const file of files) {
    const path = `${userId}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
    const { data, error } = await supabase.storage.from(CASE_DOCUMENTS_BUCKET).upload(path, file, {
      contentType: file.type || "application/octet-stream",
    });

    if (error || !data) {
      console.error("Case document upload failed", {
        bucket: CASE_DOCUMENTS_BUCKET,
        path,
        name: file.name,
        error,
      });
      return {
        error: "อัปโหลดเอกสารไม่สำเร็จ กรุณาตรวจสอบไฟล์และลองอีกครั้ง",
        documents: uploadedDocuments,
      };
    }

    uploadedDocuments.push({
      name: file.name,
      path: data.path,
      size: file.size,
      type: file.type || null,
    });
  }

  return { documents: uploadedDocuments };
}

export async function createCase(_state: CaseFormState, formData: FormData): Promise<CaseFormState> {
  const profile = await requireRole("debtor");
  const { payload, error } = parseCaseForm(formData);

  if (error) {
    return formError(formData, error);
  }

  const supabase = await createClient();
  const preferredMediatorId = (await cookies()).get("nt_preferred_mediator")?.value ?? "";
  const { data: preferredMediator } = preferredMediatorId
    ? await supabase.from("mediator_profiles").select("id, user_id").eq("id", preferredMediatorId).eq("status", "approved").maybeSingle()
    : { data: null };
  const uploaded = await uploadCaseDocuments(supabase, profile.id, formData);

  if (uploaded.error) {
    return formError(formData, uploaded.error);
  }

  const { data, error: insertError } = await supabase
    .from("cases")
    .insert({
      ...payload,
      uploaded_documents: [...payload.uploaded_documents, ...uploaded.documents],
      debtor_user_id: profile.id,
      selected_mediator_profile_id: preferredMediator?.id ?? null,
      assigned_mediator_id: preferredMediator?.user_id ?? null,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !data) {
    console.error("Case insert failed", insertError);
    return formError(formData, "บันทึกคำขอไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  if (uploaded.documents.length > 0) {
    const { error: documentError } = await supabase.from("case_documents").insert(
      uploaded.documents.map((document) => ({
        case_id: data.id,
        uploaded_by: profile.id,
        storage_path: document.path,
        file_name: document.name,
        mime_type: document.type,
        size_bytes: document.size,
      })),
    );
    if (documentError) console.error("Case document metadata insert failed", documentError);
  }

  await supabase.from("case_status_history").insert({
    case_id: data.id,
    from_status: null,
    to_status: "draft",
    note: preferredMediator ? "สร้างแบบร่างคำขอไกล่เกลี่ยพร้อมผู้ไกล่เกลี่ยที่เลือกไว้ล่วงหน้า" : "สร้างแบบร่างคำขอไกล่เกลี่ย",
  });

  redirect(`/debtor/cases/${data.id}/ai?success=${encodeURIComponent("บันทึกแบบร่างแล้ว กรุณาเตรียมเคสกับ AI ก่อนส่ง")}`);
}

export async function updateCase(caseId: string, _state: CaseFormState, formData: FormData): Promise<CaseFormState> {
  const profile = await requireRole("debtor");
  const currentCase = await getCaseForDebtor(caseId, profile.id);

  if (!isEditableCase(currentCase.status)) {
    redirectWithError(`/debtor/cases/${caseId}`, "ไม่สามารถแก้ไขคำขอที่ส่งเข้าสู่กระบวนการแล้ว");
  }

  const { payload, error } = parseCaseForm(formData);

  if (error) {
    return formError(formData, error);
  }

  const supabase = await createClient();
  const uploaded = await uploadCaseDocuments(supabase, profile.id, formData);

  if (uploaded.error) {
    return formError(formData, uploaded.error);
  }

  const { error: updateError } = await supabase
    .from("cases")
    .update({
      ...payload,
      uploaded_documents: [...payload.uploaded_documents, ...uploaded.documents],
    })
    .eq("id", caseId)
    .eq("debtor_user_id", profile.id);

  if (updateError) {
    console.error("Case update failed", updateError);
    return formError(formData, "บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง");
  }


  if (uploaded.documents.length > 0) {
    const { error: documentError } = await supabase.from("case_documents").insert(
      uploaded.documents.map((document) => ({
        case_id: caseId,
        uploaded_by: profile.id,
        storage_path: document.path,
        file_name: document.name,
        mime_type: document.type,
        size_bytes: document.size,
      })),
    );
    if (documentError) console.error("Case document metadata insert failed", documentError);
  }

  redirect(`/debtor/cases/${caseId}?success=${encodeURIComponent("บันทึกการแก้ไขสำเร็จ")}`);
}

export async function submitCase(formData: FormData) {
  const profile = await requireRole("debtor");
  const caseId = String(formData.get("case_id") ?? "");

  if (!caseId) {
    redirectWithError("/debtor", "ไม่พบคำขอที่ต้องการส่งตรวจสอบ");
  }

  const currentCase = await getCaseForDebtor(caseId, profile.id);

  if (currentCase.status !== "draft" && currentCase.status !== "needs_more_info") {
    redirectWithError(`/debtor/cases/${caseId}`, "คำขอนี้ถูกส่งเข้าสู่กระบวนการแล้ว");
  }

  const supabase = await createClient();
  const [{ data: aiSession }, { data: selectedPlan }] = await Promise.all([
    supabase.from("case_ai_sessions").select("status").eq("case_id", caseId).maybeSingle(),
    supabase.from("case_payment_plans").select("id").eq("case_id", caseId).eq("status", "selected").maybeSingle(),
  ]);
  if (!aiSession || (!["completed", "manual_bypass"].includes(aiSession.status))) {
    redirectWithError(`/debtor/cases/${caseId}/ai`, "กรุณาเตรียมเคสกับ AI ให้เสร็จก่อนส่งคำขอ");
  }
  if (aiSession.status !== "manual_bypass" && !selectedPlan) {
    redirectWithError(`/debtor/cases/${caseId}/ai`, "กรุณาเลือกแผนชำระหนึ่งรูปแบบก่อนส่งคำขอ");
  }
  const { error } = await supabase
    .from("cases")
    .update({
      status: "submitted",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", caseId)
    .eq("debtor_user_id", profile.id);

  if (error) {
    redirectWithError(`/debtor/cases/${caseId}`, "ส่งคำขอไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  await supabase.from("case_status_history").insert({
    case_id: caseId,
    from_status: currentCase.status,
    to_status: "submitted",
    note: "ลูกหนี้ส่งคำขอเข้าสู่การตรวจสอบ",
  });

  redirect(`/debtor/cases/${caseId}?success=${encodeURIComponent("ส่งคำขอเข้าสู่การตรวจสอบแล้ว")}`);
}
