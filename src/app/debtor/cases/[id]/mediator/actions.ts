"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor } from "@/lib/cases";
import { getMediatorProfile } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

export async function selectMediatorForCase(caseId: string, formData: FormData) {
  const debtor = await requireRole("debtor");
  const mediatorProfileId = String(formData.get("mediator_profile_id") ?? "");
  const currentCase = await getCaseForDebtor(caseId, debtor.id);

  if (!mediatorProfileId) {
    redirect(`/debtor/cases/${caseId}/mediator?error=${encodeURIComponent("กรุณาเลือกผู้ไกล่เกลี่ย")}`);
  }

  const mediator = await getMediatorProfile(mediatorProfileId);

  if (mediator.status !== "approved") {
    redirect(`/debtor/cases/${caseId}/mediator?error=${encodeURIComponent("ผู้ไกล่เกลี่ยนี้ยังไม่พร้อมให้เลือก")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({
      selected_mediator_profile_id: mediator.id,
      assigned_mediator_id: mediator.user_id,
      status: "mediator_selected",
    })
    .eq("id", caseId)
    .eq("debtor_user_id", debtor.id);

  if (error) {
    redirect(`/debtor/cases/${caseId}/mediator?error=${encodeURIComponent("เลือกผู้ไกล่เกลี่ยไม่สำเร็จ")}`);
  }

  await supabase.from("case_status_history").insert({
    case_id: caseId,
    from_status: currentCase.status,
    to_status: "mediator_selected",
    changed_by: debtor.id,
    note: `ลูกหนี้เลือกผู้ไกล่เกลี่ย ${mediator.first_name} ${mediator.last_name}`,
  });

  redirect(`/debtor/cases/${caseId}?success=${encodeURIComponent("เลือกผู้ไกล่เกลี่ยแล้ว")}`);
}
