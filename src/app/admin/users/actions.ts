"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { accountStatusOptions, adminRoleOptions } from "@/lib/admin/users";
import { validatePassword } from "@/lib/auth/password";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";

function usersMessage(kind: "success" | "error", message: string, userId?: string): never {
  const params = new URLSearchParams({ [kind]: message });
  if (userId) params.set("userId", userId);
  redirect(`/admin/users?${params.toString()}`);
}

export async function updateUserProfile(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const organizationName = String(formData.get("organization_name") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const accountStatus = String(formData.get("account_status") ?? "");

  if (!userId || !fullName) {
    usersMessage("error", "กรุณากรอกข้อมูลผู้ใช้ให้ครบถ้วน", userId);
  }

  if (!adminRoleOptions.some((option) => option.value === role)) {
    usersMessage("error", "บทบาทผู้ใช้ไม่ถูกต้อง", userId);
  }

  if (!accountStatusOptions.some((option) => option.value === accountStatus)) {
    usersMessage("error", "สถานะบัญชีไม่ถูกต้อง", userId);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      email: email || null,
      phone: phone || null,
      organization_name: organizationName || null,
      role: role as AppRole,
      account_status: accountStatus as never,
    })
    .eq("id", userId);

  if (error) {
    usersMessage("error", "บันทึกข้อมูลผู้ใช้ไม่สำเร็จ", userId);
  }

  revalidatePath("/admin/users");
  usersMessage("success", "บันทึกข้อมูลผู้ใช้สำเร็จ", userId);
}

export async function updateUserPassword(formData: FormData) {
  await requireAdmin();

  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");
  const validation = validatePassword(password);

  if (!userId) {
    usersMessage("error", "ไม่พบผู้ใช้ที่ต้องการอัปเดตรหัสผ่าน");
  }

  if (!validation.valid) {
    usersMessage("error", validation.errors[0] ?? "รหัสผ่านไม่ปลอดภัย", userId);
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      usersMessage("error", "อัปเดตรหัสผ่านไม่สำเร็จ", userId);
    }
  } catch {
    usersMessage("error", "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY สำหรับงานผู้ดูแลระบบ", userId);
  }

  usersMessage("success", "อัปเดตรหัสผ่านสำเร็จ", userId);
}
