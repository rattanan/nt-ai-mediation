"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { recalculateMediatorTrustScore } from "@/lib/trust-score";
import type { MediatorProfileStatus } from "@/types/database";

function go(profileId: string, message: string, kind: "success" | "error" = "success"): never {
  redirect(`/admin/mediators?profileId=${profileId}&${kind}=${encodeURIComponent(message)}`);
}

async function review(formData: FormData, nextStatus: MediatorProfileStatus, defaultNote: string) {
  const admin = await requireAdmin();
  const profileId = String(formData.get("profile_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!profileId) redirect(`/admin/mediators?error=${encodeURIComponent("ไม่พบโปรไฟล์ผู้ไกล่เกลี่ย")}`);

  const supabase = await createClient();
  const { data: current } = await supabase.from("mediator_profiles").select("status").eq("id", profileId).maybeSingle();
  const { error } = await supabase
    .from("mediator_profiles")
    .update({
      status: nextStatus,
      admin_review_note: note || defaultNote,
      approved_at: nextStatus === "approved" ? new Date().toISOString() : null,
      approved_by: nextStatus === "approved" ? admin.id : null,
    })
    .eq("id", profileId);

  if (error) go(profileId, "อัปเดตสถานะไม่สำเร็จ", "error");

  await supabase.from("mediator_review_logs").insert({
    mediator_profile_id: profileId,
    reviewer_profile_id: admin.id,
    from_status: current?.status ?? null,
    to_status: nextStatus,
    note: note || defaultNote,
  });

  if (nextStatus === "approved") {
    await recalculateMediatorTrustScore(profileId);
  }

  go(profileId, "บันทึกผลการตรวจสอบแล้ว");
}

export async function recalculateAllTrustScores() {
  await requireAdmin();
  const { recalculateAllMediatorTrustScores } = await import("@/lib/trust-score");
  await recalculateAllMediatorTrustScores();
  redirect(`/admin/mediators?success=${encodeURIComponent("คำนวณ NT Trust Score ใหม่แล้ว")}`);
}

async function reviewMediatorRating(formData: FormData, status: "approved" | "rejected") {
  const admin = await requireAdmin();
  const reviewId = String(formData.get("review_id") ?? "");
  const note = String(formData.get("admin_note") ?? "").trim() || null;
  if (!reviewId) {
    redirect(`/admin/mediators?error=${encodeURIComponent("ไม่พบรีวิวที่ต้องการตรวจสอบ")}`);
  }

  const supabase = await createClient();
  const { data: review, error } = await supabase
    .from("mediator_reviews")
    .update({
      status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      admin_note: note,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select("mediator_id")
    .single();

  if (error || !review) {
    redirect(`/admin/mediators?error=${encodeURIComponent("บันทึกผลรีวิวไม่สำเร็จ")}`);
  }

  await recalculateMediatorTrustScore(review.mediator_id);
  redirect(`/admin/mediators?success=${encodeURIComponent(status === "approved" ? "อนุมัติรีวิวและคำนวณ Trust Score แล้ว" : "ไม่อนุมัติรีวิวและคำนวณ Trust Score แล้ว")}`);
}

export async function approveMediatorReview(formData: FormData) {
  await reviewMediatorRating(formData, "approved");
}

export async function rejectMediatorReview(formData: FormData) {
  await reviewMediatorRating(formData, "rejected");
}

export async function approveMediator(formData: FormData) {
  await review(formData, "approved", "อนุมัติโปรไฟล์ผู้ไกล่เกลี่ย");
}

export async function requestMediatorRevision(formData: FormData) {
  await review(formData, "needs_revision", "ขอให้แก้ไขข้อมูลโปรไฟล์");
}

export async function rejectMediator(formData: FormData) {
  await review(formData, "rejected", "ไม่อนุมัติโปรไฟล์ผู้ไกล่เกลี่ย");
}

export async function suspendMediator(formData: FormData) {
  await review(formData, "suspended", "ระงับการแสดงผลผู้ไกล่เกลี่ย");
}
