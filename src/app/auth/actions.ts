"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";
import { getRoleHome, isAppRole } from "@/lib/auth/routes";

function authRedirect(path: string, message: string): never {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    authRedirect("/login", "กรุณากรอกอีเมลและรหัสผ่าน");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    authRedirect("/login", "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    authRedirect("/login", "ไม่พบข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง");
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profile = profileData as { role: AppRole } | null;

  if (profileError || !profile) {
    authRedirect("/register", "ยังไม่พบโปรไฟล์ กรุณาลงทะเบียนบทบาทผู้ใช้งาน");
  }

  redirect(getRoleHome(profile.role));
}

export async function register(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const roleValue = String(formData.get("role") ?? "debtor");
  const organizationName = String(formData.get("organization_name") ?? "").trim();

  if (!fullName || !email || !password) {
    authRedirect("/register", "กรุณากรอกชื่อ อีเมล และรหัสผ่าน");
  }

  if (!isAppRole(roleValue)) {
    authRedirect("/register", "บทบาทผู้ใช้งานไม่ถูกต้อง");
  }

  const role: AppRole = roleValue;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
    },
  });

  if (error || !data.user) {
    authRedirect("/register", "ลงทะเบียนไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง");
  }

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: data.user.id,
    role,
    full_name: fullName,
    organization_name: organizationName || null,
  });

  if (profileError) {
    authRedirect(
      "/login",
      "สร้างบัญชีแล้ว แต่ยังสร้างโปรไฟล์ไม่ได้ กรุณายืนยันอีเมลหรือเข้าสู่ระบบอีกครั้ง",
    );
  }

  redirect(getRoleHome(role));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
