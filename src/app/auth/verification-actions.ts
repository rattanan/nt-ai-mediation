"use server";

import { createClient } from "@/lib/supabase/server";
import { isValidEmail } from "@/lib/auth/password";
import { emailVerificationRedirectUrl, writeAuditLog } from "@/lib/auth/verification";

export type ResendVerificationResult = {
  ok: boolean;
  message: string;
};

export async function resendVerificationEmail(email: string): Promise<ResendVerificationResult> {
  const trimmedEmail = email.trim();

  if (!isValidEmail(trimmedEmail)) {
    return {
      ok: false,
      message: "กรุณากรอกอีเมลให้ถูกต้อง",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: trimmedEmail,
    options: {
      emailRedirectTo: emailVerificationRedirectUrl,
    },
  });

  if (error) {
    return {
      ok: false,
      message: "ไม่สามารถส่งอีเมลยืนยันอีกครั้งได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    };
  }

  await writeAuditLog(supabase, "EMAIL_VERIFICATION_RESENT", { email: trimmedEmail });

  return {
    ok: true,
    message: "ระบบได้ส่งอีเมลยืนยันอีกครั้งแล้ว กรุณาตรวจสอบกล่องจดหมายของคุณ",
  };
}
