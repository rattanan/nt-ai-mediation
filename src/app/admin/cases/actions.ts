"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import type { CaseStatus } from "@/types/database";

function go(caseId: string, message: string, kind: "success" | "error" = "success"): never {
  redirect(`/admin/cases?caseId=${caseId}&${kind}=${encodeURIComponent(message)}`);
}

async function updateCaseStatus(formData: FormData, status: CaseStatus, defaultNote: string) {
  const profile = await requireAdmin();
  const caseId = String(formData.get("case_id") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!caseId) {
    redirect(`/admin/cases?error=${encodeURIComponent("ไม่พบเคสที่ต้องการดำเนินการ")}`);
  }

  const supabase = await createClient();
  const { data: currentCase } = await supabase.from("cases").select("status").eq("id", caseId).maybeSingle();
  const updatePayload =
    status === "needs_more_info"
      ? { status, admin_review_note: note || defaultNote }
      : status === "closed"
        ? { status, rejection_reason: note || defaultNote, admin_review_note: note || defaultNote }
        : { status, admin_review_note: note || defaultNote };

  const { error } = await supabase.from("cases").update(updatePayload).eq("id", caseId);

  if (error) {
    go(caseId, "อัปเดตสถานะเคสไม่สำเร็จ", "error");
  }

  await supabase.from("case_status_history").insert({
    case_id: caseId,
    from_status: currentCase?.status ?? null,
    to_status: status,
    changed_by: profile.id,
    note: note || defaultNote,
  });

  if (note) {
    await supabase.from("case_comments").insert({
      case_id: caseId,
      author_profile_id: profile.id,
      audience: "internal",
      comment: note,
    });
  }

  revalidatePath("/admin/cases");
  go(caseId, "อัปเดตสถานะเคสสำเร็จ");
}

export async function sendCaseToCreditorReview(formData: FormData) {
  await updateCaseStatus(formData, "creditor_review", "ผู้ดูแลส่งเคสให้เจ้าหนี้พิจารณา");
}

export async function requestCaseMoreInfo(formData: FormData) {
  await updateCaseStatus(formData, "needs_more_info", "ผู้ดูแลขอข้อมูลเพิ่มเติมจากลูกหนี้");
}

export async function rejectCaseByAdmin(formData: FormData) {
  await updateCaseStatus(formData, "closed", "ผู้ดูแลปฏิเสธคำขอและปิดเคส");
}
