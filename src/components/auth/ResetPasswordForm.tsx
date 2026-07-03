"use client";

import { useEffect, useId, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, KeyRound } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { validatePassword } from "@/lib/auth/password";
import { createClient } from "@/lib/supabase/client";

type RecoveryState = "checking" | "valid" | "invalid" | "success";

export function ResetPasswordForm() {
  const passwordId = useId();
  const confirmPasswordId = useId();
  const messageId = useId();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    async function verifyRecoverySession() {
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!active) return;

        if (error) {
          setRecoveryState("invalid");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();

      if (!active) return;
      setRecoveryState(data.session ? "valid" : "invalid");
    }

    void verifyRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoveryState("valid");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const validation = validatePassword(newPassword);
    const nextErrors = [...validation.errors];

    if (newPassword !== confirmPassword) {
      nextErrors.push("รหัสผ่านทั้งสองช่องต้องตรงกัน");
    }

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      setSubmitError(null);
      return;
    }

    setErrors([]);
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setSubmitError("ลิงก์รีเซ็ตอาจหมดอายุหรือไม่ถูกต้อง กรุณาขอลิงก์ใหม่อีกครั้ง");
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setRecoveryState("success");
    } catch {
      setSubmitError("ไม่สามารถบันทึกรหัสผ่านใหม่ได้ กรุณาตรวจสอบการเชื่อมต่อแล้วลองอีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (recoveryState === "checking") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        <Spinner />
        กำลังตรวจสอบลิงก์รีเซ็ตรหัสผ่าน...
      </div>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <div className="space-y-5">
        <Alert variant="destructive">
          ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว กรุณาขอลิงก์ใหม่อีกครั้ง
        </Alert>
        <Button href="/forgot-password" className="h-11 w-full rounded-lg font-semibold">
          ขอ link รีเซ็ตรหัสผ่านใหม่
        </Button>
      </div>
    );
  }

  if (recoveryState === "success") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold">เปลี่ยนรหัสผ่านสำเร็จ</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            คุณสามารถกลับไปเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้แล้ว
          </p>
        </div>
        <Button href="/login" className="h-11 w-full rounded-lg font-semibold">
          กลับเข้าสู่ระบบ
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.length > 0 ? (
        <Alert variant="destructive" id={messageId}>
          <ul className="list-inside list-disc space-y-1">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </Alert>
      ) : null}

      {submitError ? (
        <Alert variant="destructive" id={messageId}>
          {submitError}
        </Alert>
      ) : null}

      <label className="block" htmlFor={passwordId}>
        <span className="text-sm font-medium">New Password</span>
        <div className="relative mt-2">
          <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={passwordId}
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            disabled={isSubmitting}
            aria-invalid={errors.length > 0 || Boolean(submitError)}
            aria-describedby={errors.length > 0 || submitError ? messageId : undefined}
            className="pl-10"
            required
          />
        </div>
      </label>

      <label className="block" htmlFor={confirmPasswordId}>
        <span className="text-sm font-medium">Confirm Password</span>
        <Input
          id={confirmPasswordId}
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isSubmitting}
          aria-invalid={errors.length > 0 || Boolean(submitError)}
          aria-describedby={errors.length > 0 || submitError ? messageId : undefined}
          className="mt-2"
          required
        />
      </label>

      <Button type="submit" className="h-11 w-full rounded-lg font-semibold" disabled={isSubmitting}>
        {isSubmitting ? <Spinner /> : null}
        {isSubmitting ? "กำลังบันทึก..." : "บันทึกรหัสผ่านใหม่"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        จำรหัสผ่านได้แล้ว?{" "}
        <Link href="/login" className="font-semibold text-[#8A6500] hover:text-foreground">
          กลับเข้าสู่ระบบ
        </Link>
      </p>
    </form>
  );
}
