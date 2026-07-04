import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";
import { getRoleHome, isAppRole } from "@/lib/auth/routes";
import {
  getFullNameFromUser,
  getOrganizationNameFromUser,
  getRoleFromUserMetadata,
  appUrl,
  isEmailVerified,
  writeAuditLog,
} from "@/lib/auth/verification";
import { getActiveConsentVersion, getPendingConsent, recordUserConsent, userHasLatestConsent } from "@/lib/consent";

function redirectWithMessage(_request: NextRequest, path: string, message: string) {
  const url = appUrl(path);
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const requestedRole = requestUrl.searchParams.get("role");
  const returnUrl = requestUrl.searchParams.get("returnUrl");

  if (!code) {
    return redirectWithMessage(request, "/login", "ลิงก์ยืนยันไม่ถูกต้องหรือหมดอายุ กรุณาลองอีกครั้ง");
  }

  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return redirectWithMessage(request, "/login", "ยืนยันบัญชีหรือเข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirectWithMessage(request, "/login", "ไม่พบข้อมูลผู้ใช้งาน กรุณาลองอีกครั้ง");
  }

  if (!isEmailVerified(user)) {
    return redirectWithMessage(
      request,
      `/verify-email?email=${encodeURIComponent(user.email ?? "")}`,
      "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ",
    );
  }

  const { data: existingProfile, error: profileLookupError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    return redirectWithMessage(request, "/login", "ตรวจสอบโปรไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  let role = (existingProfile?.role ?? null) as AppRole | null;

  if (!role) {
    role = requestedRole && isAppRole(requestedRole) ? requestedRole : getRoleFromUserMetadata(user);
  }

  let { error: profileUpdateError } = await supabase.from("profiles").upsert({
    id: user.id,
    role,
    email: user.email ?? null,
    full_name: getFullNameFromUser(user),
    organization_name: getOrganizationNameFromUser(user),
    email_verified: true,
    account_status: "active",
  });

  if (profileUpdateError) {
    console.error("Full profile upsert failed in auth callback, retrying legacy profile shape", {
      code: profileUpdateError.code,
      message: profileUpdateError.message,
    });

    const legacyResult = await supabase.from("profiles").upsert({
      id: user.id,
      role,
      full_name: getFullNameFromUser(user),
      organization_name: getOrganizationNameFromUser(user),
    });

    profileUpdateError = legacyResult.error;
  }

  if (profileUpdateError) {
    return redirectWithMessage(request, "/login", "อัปเดตโปรไฟล์หลังยืนยันบัญชีไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  await writeAuditLog(supabase, "EMAIL_VERIFICATION_COMPLETED", { email: user.email ?? null }, user.id);

  const providers = Array.isArray(user.app_metadata?.providers) ? user.app_metadata.providers : [];
  const isGoogleUser = user.app_metadata?.provider === "google" || providers.includes("google");

  if (!isGoogleUser) {
    const confirmedUrl = appUrl("/auth/email-confirmed");
    return NextResponse.redirect(confirmedUrl);
  }

  const nextPath = returnUrl?.startsWith("/") ? returnUrl : getRoleHome(role);
  const activeConsent = await getActiveConsentVersion();
  if (!(await userHasLatestConsent(user.id, activeConsent.version))) {
    const pendingConsent = await getPendingConsent(activeConsent.version);
    if (pendingConsent) {
      await recordUserConsent(user.id, activeConsent.version, pendingConsent.language);
      return NextResponse.redirect(appUrl(nextPath));
    }

    const consentUrl = appUrl("/auth/consent");
    consentUrl.searchParams.set("next", nextPath);
    return NextResponse.redirect(consentUrl);
  }

  const redirectUrl = appUrl(nextPath);

  return NextResponse.redirect(redirectUrl);
}
