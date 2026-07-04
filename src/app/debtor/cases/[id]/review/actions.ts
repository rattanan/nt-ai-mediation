"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor } from "@/lib/cases";
import { getClosingForCase } from "@/lib/closing";
import { createClient } from "@/lib/supabase/server";

function go(caseId: string, message: string, kind: "success" | "error" = "success"): never {
  redirect(`/debtor/cases/${caseId}?${kind}=${encodeURIComponent(message)}`);
}

export async function submitMediatorReview(caseId: string, formData: FormData) {
  const profile = await requireRole("debtor");
  const item = await getCaseForDebtor(caseId, profile.id);

  if (item.status !== "settled" && item.status !== "closed") {
    go(caseId, "ให้คะแนนผู้ไกล่เกลี่ยได้หลังเคสสำเร็จแล้วเท่านั้น", "error");
  }

  const closing = await getClosingForCase(caseId);
  const mediatorId = closing?.mediator_id ?? item.selected_mediator_profile_id;
  if (!mediatorId) {
    go(caseId, "ไม่พบข้อมูลผู้ไกล่เกลี่ยของเคสนี้", "error");
  }

  const rating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    go(caseId, "กรุณาให้คะแนน 1-5 ดาว", "error");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mediator_reviews").insert({
    case_id: caseId,
    mediator_id: mediatorId,
    debtor_user_id: profile.id,
    rating,
    comment: comment || null,
    status: "pending",
  });

  if (error) {
    console.error("Mediator review insert failed", error);
    go(caseId, "ส่งรีวิวไม่สำเร็จ หรือเคสนี้เคยให้คะแนนแล้ว", "error");
  }

  go(caseId, "ส่งรีวิวแล้ว รอผู้ดูแลอนุมัติก่อนนำไปคำนวณ NT Trust Score");
}
