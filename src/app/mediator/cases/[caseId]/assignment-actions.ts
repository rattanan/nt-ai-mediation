"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { getMediatorProfileByUser } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

function go(caseId: string, kind: "success" | "error", message: string): never {
  redirect(`/mediator/cases/${caseId}?${kind}=${encodeURIComponent(message)}`);
}

async function getAssignment(formData: FormData) {
  const profile = await requireRole("mediator");
  const mediator = await getMediatorProfileByUser(profile.id);
  const caseId = String(formData.get("case_id") ?? "");
  if (!mediator || mediator.status !== "approved" || !caseId) {
    go(caseId, "error", "ไม่พบโปรไฟล์ผู้ไกล่เกลี่ยหรือเคสที่ต้องการดำเนินการ");
  }
  return { profile, mediator, caseId, supabase: await createClient() };
}

export async function acceptCaseAssignment(formData: FormData) {
  const { profile, mediator, caseId, supabase } = await getAssignment(formData);
  const { data: updated, error } = await supabase
    .from("cases")
    .update({ status: "appointment_scheduling" })
    .eq("id", caseId)
    .eq("selected_mediator_profile_id", mediator.id)
    .eq("assigned_mediator_id", profile.id)
    .eq("status", "mediator_selected")
    .select("id")
    .maybeSingle();

  if (error || !updated) go(caseId, "error", "ไม่สามารถรับเคสได้ เคสอาจถูกดำเนินการไปแล้ว");
  const { error: historyError } = await supabase.from("case_status_history").insert({
    case_id: caseId,
    from_status: "mediator_selected",
    to_status: "appointment_scheduling",
    changed_by: profile.id,
    note: "ผู้ไกล่เกลี่ยตอบรับเคสและพร้อมนัดหมาย",
  });
  if (historyError) console.error("Unable to record mediator acceptance history", historyError);
  revalidatePath(`/mediator/cases/${caseId}`);
  revalidatePath(`/debtor/cases/${caseId}`);
  go(caseId, "success", "รับเคสแล้ว กรุณารอคู่กรณีเลือกเวลานัดหมาย");
}

export async function rejectCaseAssignment(formData: FormData) {
  const { profile, mediator, caseId, supabase } = await getAssignment(formData);
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) go(caseId, "error", "กรุณาระบุเหตุผลที่ไม่สามารถรับเคสได้");

  const { data: updated, error } = await supabase
    .from("cases")
    .update({ status: "mediator_matching", selected_mediator_profile_id: null, assigned_mediator_id: null })
    .eq("id", caseId)
    .eq("selected_mediator_profile_id", mediator.id)
    .eq("assigned_mediator_id", profile.id)
    .eq("status", "mediator_selected")
    .select("id")
    .maybeSingle();

  if (error || !updated) go(caseId, "error", "ไม่สามารถปฏิเสธเคสได้ เคสอาจถูกดำเนินการไปแล้ว");
  const { error: historyError } = await supabase.from("case_status_history").insert({
    case_id: caseId,
    from_status: "mediator_selected",
    to_status: "mediator_matching",
    changed_by: profile.id,
    note: `ผู้ไกล่เกลี่ยปฏิเสธเคส: ${reason}`,
  });
  if (historyError) console.error("Unable to record mediator rejection history", historyError);
  revalidatePath("/mediator/cases");
  revalidatePath(`/debtor/cases/${caseId}`);
  redirect(`/mediator/cases?success=${encodeURIComponent("ปฏิเสธเคสแล้ว ระบบส่งกลับไปจับคู่ผู้ไกล่เกลี่ยใหม่")}`);
}
