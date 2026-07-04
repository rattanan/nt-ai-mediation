"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { getRoleHome } from "@/lib/auth/routes";
import {
  type ConsentLanguage,
  getActiveConsentVersion,
  recordUserConsent,
  setPendingConsentCookie,
} from "@/lib/consent";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  return next.startsWith("/") && !next.startsWith("//") ? next : "";
}

export async function acceptConsent(formData: FormData) {
  const active = await getActiveConsentVersion();
  const language = String(formData.get("language") ?? "th") === "en" ? "en" : "th";
  const scrolled = formData.get("scrolled_to_bottom") === "true";
  const checks = ["agree_terms", "agree_pdpa", "agree_ai", "agree_recording"].every(
    (name) => formData.get(name) === "on",
  );

  if (!scrolled || !checks) {
    redirect(`/auth/consent?error=${encodeURIComponent("กรุณาอ่านเงื่อนไขให้ครบและยืนยันทุกข้อ")}`);
  }

  const profile = await getCurrentProfile();
  if (profile) {
    await recordUserConsent(profile.id, active.version, language as ConsentLanguage);
    const next = safeNext(formData.get("next"));
    redirect(next || getRoleHome(profile.role));
  }

  await setPendingConsentCookie(active.version, language as ConsentLanguage);
  redirect("/register?consent=accepted");
}
