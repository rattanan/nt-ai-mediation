"use server";

import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";
import { getFeeSettings } from "@/lib/closing";
import { createClient } from "@/lib/supabase/server";

function num(formData: FormData, name: string, fallback: number) {
  const value = Number(String(formData.get(name) ?? ""));
  return Number.isFinite(value) ? value : fallback;
}

export async function saveFeeSettings(formData: FormData) {
  await requireRole("admin");
  const current = await getFeeSettings();
  const supabase = await createClient();
  const payload = {
    platform_fee_percent: num(formData, "platform_fee_percent", 3),
    success_fee_percent: num(formData, "success_fee_percent", 10),
    currency: String(formData.get("currency") ?? "THB").trim() || "THB",
    vat_percent: num(formData, "vat_percent", 0),
    invoice_prefix: String(formData.get("invoice_prefix") ?? "NTINV").trim() || "NTINV",
    payment_due_days: Math.max(1, Math.round(num(formData, "payment_due_days", 15))),
    bank_account_name: String(formData.get("bank_account_name") ?? "").trim() || null,
    bank_account_number: String(formData.get("bank_account_number") ?? "").trim() || null,
    bank_name: String(formData.get("bank_name") ?? "").trim() || null,
    fee_policy_description: String(formData.get("fee_policy_description") ?? "").trim() || null,
  };
  const query = current.id === "default"
    ? supabase.from("fee_settings").insert(payload)
    : supabase.from("fee_settings").update(payload).eq("id", current.id);
  const { error } = await query;
  if (error) redirect(`/admin/settings?error=${encodeURIComponent("บันทึก Fee Settings ไม่สำเร็จ")}`);
  redirect(`/admin/settings?success=${encodeURIComponent("บันทึก Fee Settings แล้ว")}`);
}

export async function saveConsentVersion(formData: FormData) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const version = String(formData.get("version") ?? "").trim();
  const titleTh = String(formData.get("title_th") ?? "").trim();
  const titleEn = String(formData.get("title_en") ?? "").trim();
  const contentTh = String(formData.get("content_th") ?? "").trim();
  const contentEn = String(formData.get("content_en") ?? "").trim();

  if (!version || !titleTh || !titleEn || !contentTh || !contentEn) {
    redirect(`/admin/settings?error=${encodeURIComponent("กรุณากรอกข้อมูล Consent ให้ครบถ้วน")}`);
  }

  const { error: disableError } = await supabase
    .from("consent_versions")
    .update({ is_active: false })
    .eq("is_active", true);

  if (disableError) {
    redirect(`/admin/settings?error=${encodeURIComponent("ปิดใช้งาน Consent เดิมไม่สำเร็จ")}`);
  }

  const { error } = await supabase.from("consent_versions").upsert(
    {
      version,
      title_th: titleTh,
      title_en: titleEn,
      content_th: contentTh,
      content_en: contentEn,
      is_active: true,
      created_by: profile.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "version" },
  );

  if (error) redirect(`/admin/settings?error=${encodeURIComponent("บันทึก Consent Version ไม่สำเร็จ")}`);
  redirect(`/admin/settings?success=${encodeURIComponent("บันทึก Consent Version แล้ว")}`);
}

export async function saveAiRatePolicy(formData: FormData) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const debtType = String(formData.get("debt_type") ?? "*").trim() || "*";
  const minInterest = Math.max(0, num(formData, "min_interest_rate", 0));
  const maxInterest = Math.max(minInterest, num(formData, "max_interest_rate", minInterest));
  const minDiscount = Math.min(100, Math.max(0, num(formData, "min_discount_rate", 0)));
  const maxDiscount = Math.min(100, Math.max(minDiscount, num(formData, "max_discount_rate", minDiscount)));
  const { error } = await supabase.from("ai_rate_policies").upsert({ debt_type: debtType, min_interest_rate: minInterest, max_interest_rate: maxInterest, min_discount_rate: minDiscount, max_discount_rate: maxDiscount, active: true, updated_by: profile.id }, { onConflict: "debt_type" });
  if (error) redirect(`/admin/settings?error=${encodeURIComponent("บันทึกช่วงสมมติฐาน AI ไม่สำเร็จ")}`);
  redirect(`/admin/settings?success=${encodeURIComponent("บันทึกช่วงดอกเบี้ยและส่วนลดสำหรับ AI แล้ว")}`);
}
