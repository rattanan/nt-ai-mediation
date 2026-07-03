"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { Mail } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isValidEmail, passwordResetRedirectUrl } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

const successMessage =
  "หากอีเมลนี้มีอยู่ในระบบ ระบบได้ส่งลิงก์สำหรับรีเซ็ตรหัสผ่านแล้ว";

export function ForgotPasswordForm() {
  const emailId = useId();
  const messageId = useId();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const trimmedEmail = email.trim();

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("กรุณากรอกอีเมลให้ถูกต้อง");
      setStatus("idle");
      return;
    }

    setEmailError(null);
    setStatus("idle");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: passwordResetRedirectUrl,
      });

      if (error) {
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {status === "success" ? (
        <Alert variant="success" id={messageId}>
          {successMessage}
        </Alert>
      ) : null}

      {status === "error" ? (
        <Alert variant="destructive" id={messageId}>
          ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
        </Alert>
      ) : null}

      <label className="block" htmlFor={emailId}>
        <span className="text-sm font-medium">Email Address</span>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={emailId}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(null);
            }}
            disabled={isSubmitting}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError || status !== "idle" ? messageId : undefined}
            className="pl-10"
            placeholder="name@example.com"
            required
          />
        </div>
      </label>

      {emailError ? (
        <p id={messageId} className="text-sm text-red-600">
          {emailError}
        </p>
      ) : null}

      <Button type="submit" className="h-11 w-full rounded-lg font-semibold" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null}
        {isSubmitting ? "กำลังส่งลิงก์..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
      </Button>
    </form>
  );
}
