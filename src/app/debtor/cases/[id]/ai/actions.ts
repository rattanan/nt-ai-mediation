"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { answerCaseInterview, initializeCasePreparation } from "@/lib/ai/case-preparation";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor } from "@/lib/cases";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireOwnedCase(caseId: string) {
  const profile = await requireRole("debtor");
  await getCaseForDebtor(caseId, profile.id);
  return profile;
}

export async function startAiPreparation(formData: FormData) {
  const caseId = String(formData.get("case_id") ?? "");
  await requireOwnedCase(caseId);
  const admin = createAdminClient();
  const { data: previous } = await admin.from("ai_processing_jobs").select("attempts").eq("case_id", caseId).eq("job_type", "assessment").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const attempts = Math.min(3, (previous?.attempts ?? 0) + 1);
  const { data: job } = await admin.from("ai_processing_jobs").insert({ case_id: caseId, job_type: "assessment", status: "processing", attempts, started_at: new Date().toISOString() }).select("id").single();
  try {
    await initializeCasePreparation(caseId);
    if (job) await admin.from("ai_processing_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job.id);
    revalidatePath(`/debtor/cases/${caseId}/ai`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "AI processing failed";
    if (job) await admin.from("ai_processing_jobs").update({ status: "failed", last_error: message, completed_at: new Date().toISOString() }).eq("id", job.id);
    await admin.from("case_ai_sessions").upsert({ case_id: caseId, status: "failed" }, { onConflict: "case_id" });
    redirect(`/debtor/cases/${caseId}/ai?error=${encodeURIComponent(attempts >= 3 ? "ระบบประมวลผลไม่สำเร็จครบ 3 ครั้ง สามารถขอตรวจแบบ manual ได้" : "ประมวลผลไม่สำเร็จ กรุณาลองใหม่")}`);
  }
}

export async function submitInterviewAnswer(formData: FormData) {
  const caseId = String(formData.get("case_id") ?? "");
  const answer = formData.get("answer_unknown") === "true"
    ? "ไม่ทราบ"
    : String(formData.get("answer") ?? "").trim();
  await requireOwnedCase(caseId);
  if (answer.length > 2_000) redirect(`/debtor/cases/${caseId}/ai?error=${encodeURIComponent("คำตอบยาวเกิน 2,000 ตัวอักษร")}`);
  try {
    await answerCaseInterview(caseId, answer || "ไม่ทราบ");
  } catch (error) {
    console.error("AI interview failed", error);
    redirect(`/debtor/cases/${caseId}/ai?error=${encodeURIComponent("บันทึกคำตอบแล้ว แต่ AI ยังประมวลผลต่อไม่สำเร็จ กรุณาลองอีกครั้ง")}`);
  }
  revalidatePath(`/debtor/cases/${caseId}/ai`);
}

export async function selectPaymentPlan(formData: FormData) {
  const caseId = String(formData.get("case_id") ?? "");
  const planId = String(formData.get("plan_id") ?? "");
  await requireOwnedCase(caseId);
  const supabase = await createClient();
  const { data: plan } = await supabase.from("case_payment_plans").select("id").eq("id", planId).eq("case_id", caseId).maybeSingle();
  if (!plan) redirect(`/debtor/cases/${caseId}/ai?error=${encodeURIComponent("ไม่พบแผนที่เลือก")}`);
  const admin = createAdminClient();
  await admin.from("case_payment_plans").update({ status: "proposed", selected_at: null }).eq("case_id", caseId).eq("status", "selected");
  const { error } = await admin.from("case_payment_plans").update({ status: "selected", selected_at: new Date().toISOString() }).eq("id", planId).eq("case_id", caseId);
  if (error) redirect(`/debtor/cases/${caseId}/ai?error=${encodeURIComponent("เลือกแผนไม่สำเร็จ")}`);
  await admin.from("case_ai_sessions").update({ status: "completed", completed_at: new Date().toISOString() }).eq("case_id", caseId);
  revalidatePath(`/debtor/cases/${caseId}/ai`);
}

export async function requestManualBypass(formData: FormData) {
  const caseId = String(formData.get("case_id") ?? "");
  await requireOwnedCase(caseId);
  const admin = createAdminClient();
  const { data: latest } = await admin.from("ai_processing_jobs").select("attempts, status").eq("case_id", caseId).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!latest || latest.attempts < 3 || latest.status !== "failed") redirect(`/debtor/cases/${caseId}/ai?error=${encodeURIComponent("ต้องลองประมวลผลให้ครบ 3 ครั้งก่อนใช้ manual bypass")}`);
  await admin.from("case_ai_sessions").upsert({ case_id: caseId, status: "manual_bypass", bypass_reason: "AI/OCR failed after 3 attempts", completed_at: new Date().toISOString() }, { onConflict: "case_id" });
  await admin.from("case_documents").update({ ocr_status: "manual_bypass" }).eq("case_id", caseId).eq("ocr_status", "failed");
  await admin.from("ai_processing_jobs").insert({ case_id: caseId, job_type: "assessment", status: "manual_bypass", attempts: 3, last_error: "Flagged for admin manual review" });
  redirect(`/debtor/cases/${caseId}?success=${encodeURIComponent("ส่งเคสเข้าสู่ช่องทางตรวจด้วยเจ้าหน้าที่แล้ว")}`);
}
