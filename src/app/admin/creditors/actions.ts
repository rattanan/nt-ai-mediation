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
  const payload: { status: CreditorOrganizationStatus; is_public?: boolean } = { status };
  if (status === "approved") payload.is_public = true;
  if (status === "rejected" || status === "suspended") payload.is_public = false;
  const { error } = await supabase
    .from("creditor_organizations")
    .update(payload)
    .eq("id", id);

  if (error) {
    go("อัปเดตสถานะองค์กรไม่สำเร็จ", "error");
  }

  revalidatePath("/admin/creditors");
  go("อัปเดตสถานะองค์กรสำเร็จ");
}

export async function updateCreditorOrganizationInfo(formData: FormData) {
  await requireAdmin();
  const organizationId = String(formData.get("organization_id") ?? "");
  const organizationName = String(formData.get("organization_name") ?? "").trim();
  const organizationType = String(formData.get("organization_type") ?? "").trim();
  const taxId = String(formData.get("tax_id") ?? "").trim();
  const contactEmail = String(formData.get("contact_email") ?? "").trim();
  const contactPhone = String(formData.get("contact_phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const shortName = String(formData.get("short_name") ?? "").trim();

  if (!organizationId || !organizationName || !organizationType) {
    go("กรุณากรอกชื่อองค์กรและประเภทองค์กร", "error");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("creditor_organizations")
    .update({
      organization_name: organizationName,
      organization_type: organizationType,
      tax_id: taxId || null,
      contact_email: contactEmail || null,
      contact_phone: contactPhone || null,
      address: address || null,
      website: website || null,
      short_name: shortName || null,
    })
    .eq("id", organizationId);

  if (error) {
    go("บันทึกข้อมูลองค์กรไม่สำเร็จ", "error");
  }

  revalidatePath("/admin/creditors");
  redirect(`/admin/creditors?orgId=${encodeURIComponent(organizationId)}&success=${encodeURIComponent("บันทึกข้อมูลองค์กรแล้ว")}`);
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
