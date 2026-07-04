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
