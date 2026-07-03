"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor, isEditableCase, parseCaseForm } from "@/lib/cases";
import { createClient } from "@/lib/supabase/server";

function redirectWithError(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function createCase(formData: FormData) {
  const profile = await requireRole("debtor");
  const { payload, error } = parseCaseForm(formData);

  if (error) {
    redirectWithError("/debtor/cases/new", error);
  }

  const supabase = await createClient();
  const { data, error: insertError } = await supabase
    .from("cases")
    .insert({
      ...payload,
      debtor_user_id: profile.id,
      status: "draft",
    })
    .select("id")
    .single();

  if (insertError || !data) {
    redirectWithError("/debtor/cases/new", "บันทึกคำขอไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  await supabase.from("case_status_history").insert({
    case_id: data.id,
    from_status: null,
    to_status: "draft",
    note: "สร้างแบบร่างคำขอไกล่เกลี่ย",
  });

  redirect(`/debtor/cases/${data.id}?success=${encodeURIComponent("บันทึกแบบร่างสำเร็จ")}`);
}

export async function updateCase(caseId: string, formData: FormData) {
  const profile = await requireRole("debtor");
  const currentCase = await getCaseForDebtor(caseId, profile.id);

  if (!isEditableCase(currentCase.status)) {
    redirectWithError(`/debtor/cases/${caseId}`, "ไม่สามารถแก้ไขคำขอที่ส่งเข้าสู่กระบวนการแล้ว");
  }

  const { payload, error } = parseCaseForm(formData);

  if (error) {
    redirectWithError(`/debtor/cases/${caseId}/edit`, error);
  }

  const supabase = await createClient();
  const { error: updateError } = await supabase
    .from("cases")
    .update(payload)
    .eq("id", caseId)
    .eq("debtor_user_id", profile.id);

  if (updateError) {
    redirectWithError(`/debtor/cases/${caseId}/edit`, "บันทึกการแก้ไขไม่สำเร็จ กรุณาลองอีกครั้ง");
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
