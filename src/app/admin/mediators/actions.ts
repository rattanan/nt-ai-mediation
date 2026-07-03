"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
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

  go(profileId, "บันทึกผลการตรวจสอบแล้ว");
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
