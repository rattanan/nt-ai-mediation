"use client";

import { useId, useState } from "react";
import type { FormEvent } from "react";
import { MailCheck } from "lucide-react";
import { resendVerificationEmail } from "@/app/auth/verification-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { isValidEmail } from "@/lib/auth/password";

export function VerifyEmailForm({ initialEmail = "" }: { initialEmail?: string }) {
  const emailId = useId();
  const messageId = useId();
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setMessage("");
    setIsSubmitting(true);

    try {
      const result = await resendVerificationEmail(trimmedEmail);
      setStatus(result.ok ? "success" : "error");
      setMessage(result.message);
    } catch {
      setStatus("error");
      setMessage("ไม่สามารถส่งอีเมลยืนยันอีกครั้งได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {status === "success" ? (
        <Alert variant="success" id={messageId}>
          {message}
        </Alert>
      ) : null}

      {status === "error" ? (
        <Alert variant="destructive" id={messageId}>
          {message}
        </Alert>
      ) : null}

      <label htmlFor={emailId} className="block">
        <span className="text-sm font-medium">อีเมลสำหรับรับลิงก์ยืนยัน</span>
        <div className="relative mt-2">
          <MailCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={emailId}
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(null);
            }}
            disabled={isSubmitting}
            className="pl-10"
            placeholder="name@example.com"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError || status !== "idle" ? messageId : undefined}
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
        {isSubmitting ? "กำลังส่งอีเมล..." : "ส่งอีเมลยืนยันอีกครั้ง"}
      </Button>
    </form>
  );
}
