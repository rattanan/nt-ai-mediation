"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";
import { getRoleHome, isAppRole } from "@/lib/auth/routes";
import { formError, type FormState } from "@/lib/form-state";
import {
  emailVerificationRedirectUrl,
  getFullNameFromUser,
  getOrganizationNameFromUser,
  getRoleFromUserMetadata,
  isEmailVerified,
  writeAuditLog,
} from "@/lib/auth/verification";
import { getActiveConsentVersion, getPendingConsent, recordUserConsent, userHasLatestConsent } from "@/lib/consent";

function authRedirect(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

type ProfileSeed = {
  id: string;
  role: AppRole;
  email?: string | null;
  fullName: string;
  organizationName?: string | null;
  emailVerified?: boolean;
  accountStatus?: "pending_verification" | "active";
};

async function upsertProfile(seed: ProfileSeed) {
  const supabase = await createClient();

  const fullResult = await supabase.from("profiles").upsert({
    id: seed.id,
    role: seed.role,
    email: seed.email ?? null,
    full_name: seed.fullName,
    organization_name: seed.organizationName || null,
    email_verified: seed.emailVerified ?? false,
    account_status: seed.accountStatus ?? "pending_verification",
  });

  if (!fullResult.error) {
    return fullResult;
  }

  console.error("Full profile upsert failed, retrying legacy profile shape", {
    code: fullResult.error.code,
    message: fullResult.error.message,
  });

  return supabase.from("profiles").upsert({
    id: seed.id,
    role: seed.role,
    full_name: seed.fullName,
    phone: null,
    organization_name: seed.organizationName || null,
  });
}

export async function login(_state: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnUrl = String(formData.get("return_url") ?? "").trim();

  if (!email || !password) {
    return formError(formData, "กรุณากรอกอีเมลและรหัสผ่าน");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return formError(formData, "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return formError(formData, "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง");
  }

  if (!isEmailVerified(user)) {
    authRedirect(
      `/verify-email?email=${encodeURIComponent(user.email ?? email)}`,
      "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ",
    );
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileData as { role: AppRole; account_status?: string } | null;

  if (profileError) {
    console.error("Profile lookup failed after login", profileError);
    return formError(formData, "เข้าสู่ระบบแล้ว แต่โหลดโปรไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง");
  }

  if (!profile) {
    const role = getRoleFromUserMetadata(user);
    const { error: createProfileError } = await upsertProfile({
      id: user.id,
      role,
      email: user.email ?? null,
      fullName: getFullNameFromUser(user),
      organizationName: getOrganizationNameFromUser(user),
      emailVerified: true,
      accountStatus: "active",
    });

    if (createProfileError) {
      console.error("Profile creation failed after login", createProfileError);
      return formError(formData, "เข้าสู่ระบบแล้ว แต่ยังสร้างโปรไฟล์ไม่ได้ กรุณาติดต่อผู้ดูแลระบบ");
    }

    const activeConsent = await getActiveConsentVersion();
    if (!(await userHasLatestConsent(user.id, activeConsent.version))) {
      redirect(`/auth/consent?next=${encodeURIComponent(returnUrl.startsWith("/") ? returnUrl : getRoleHome(role))}`);
    }

    redirect(returnUrl.startsWith("/") ? returnUrl : getRoleHome(role));
  }

  const activeConsent = await getActiveConsentVersion();
  if (!(await userHasLatestConsent(user.id, activeConsent.version))) {
    redirect(`/auth/consent?next=${encodeURIComponent(returnUrl.startsWith("/") ? returnUrl : getRoleHome(profile.role))}`);
  }

  redirect(returnUrl.startsWith("/") ? returnUrl : getRoleHome(profile.role));
}

export async function register(_state: FormState, formData: FormData): Promise<FormState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleValue = String(formData.get("role") ?? "debtor");
  const organizationName = String(formData.get("organization_name") ?? "").trim();

  if (!fullName || !email || !password) {
    return formError(formData, "กรุณากรอกชื่อ อีเมล และรหัสผ่าน");
  }

  if (!isAppRole(roleValue)) {
    return formError(formData, "บทบาทผู้ใช้งานไม่ถูกต้อง");
  }

  const activeConsent = await getActiveConsentVersion();
  const pendingConsent = await getPendingConsent(activeConsent.version);

  if (!pendingConsent) {
    return formError(formData, "กรุณาอ่านและยอมรับเงื่อนไขการใช้งานก่อนลงทะเบียน");
  }

  const role: AppRole = roleValue;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: emailVerificationRedirectUrl,
      data: {
        full_name: fullName,
        organization_name: organizationName || null,
        role,
      },
    },
  });

  if (error || !data.user) {
    console.error("Supabase signUp failed", error);
    return formError(formData, error?.message ?? "ลงทะเบียนไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง");
  }

  const isExistingEmail = data.user.identities?.length === 0;

  if (isExistingEmail) {
    authRedirect("/login", "อีเมลนี้มีบัญชีอยู่แล้ว กรุณาเข้าสู่ระบบ");
  }

  if (data.session && isEmailVerified(data.user)) {
    const { error: profileError } = await upsertProfile({
      id: data.user.id,
      role,
      email,
      fullName,
      organizationName,
      emailVerified: true,
      accountStatus: "active",
    });

    if (profileError) {
      console.error("Profile creation failed after confirmed register", profileError);
      authRedirect("/login", "สร้างบัญชีสำเร็จแล้ว แต่ยังสร้างโปรไฟล์ไม่ได้ กรุณาเข้าสู่ระบบอีกครั้ง");
    }

    await recordUserConsent(data.user.id, activeConsent.version, pendingConsent.language);

    redirect(getRoleHome(role));
  }

  const { error: profileError } = await upsertProfile({
    id: data.user.id,
    role,
    email,
    fullName,
    organizationName,
  });

  if (profileError) {
    console.error("Profile creation failed after register", profileError);
  }

  await recordUserConsent(data.user.id, activeConsent.version, pendingConsent.language);
  await writeAuditLog(supabase, "EMAIL_VERIFICATION_SENT", { email }, data.user.id);

  redirect(`/verify-email?email=${encodeURIComponent(email)}&status=registered`);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
