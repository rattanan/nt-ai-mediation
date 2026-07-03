"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import type { CreditorOrganizationStatus } from "@/types/database";

function go(message: string, kind: "success" | "error" = "success"): never {
  redirect(`/admin/creditors?${kind}=${encodeURIComponent(message)}`);
}

export async function updateCreditorOrganizationStatus(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("organization_id") ?? "");
  const status = String(formData.get("status") ?? "") as CreditorOrganizationStatus;
  const allowed: CreditorOrganizationStatus[] = ["pending", "approved", "rejected", "suspended"];

  if (!id || !allowed.includes(status)) {
    go("ข้อมูลองค์กรไม่ถูกต้อง", "error");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("creditor_organizations").update({ status }).eq("id", id);

  if (error) {
    go("อัปเดตสถานะองค์กรไม่สำเร็จ", "error");
  }

  revalidatePath("/admin/creditors");
  go("อัปเดตสถานะองค์กรสำเร็จ");
}

export async function linkCaseToCreditorOrganization(formData: FormData) {
  await requireAdmin();
  const caseNumber = String(formData.get("case_number") ?? "").trim();
  const organizationId = String(formData.get("organization_id") ?? "");

  if (!caseNumber || !organizationId) {
    go("กรุณากรอกเลขเคสและองค์กร", "error");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cases")
    .update({ creditor_organization_id: organizationId })
    .eq("case_number", caseNumber);

  if (error) {
    go("เชื่อมเคสกับองค์กรไม่สำเร็จ", "error");
  }

  revalidatePath("/admin/creditors");
  go("เชื่อมเคสกับองค์กรสำเร็จ");
}
