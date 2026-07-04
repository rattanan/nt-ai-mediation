"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Mail } from "lucide-react";
import { login } from "@/app/auth/actions";
import { emptyFormState } from "@/lib/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-lg bg-[#FFD200] px-4 text-sm font-semibold text-[#111827] hover:bg-[#F5B800] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
    </button>
  );
}

export function LoginForm({ returnUrl }: { returnUrl: string }) {
  const [state, formAction] = useActionState(login, emptyFormState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="return_url" value={returnUrl} />
      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">อีเมล</span>
        <div className="relative mt-2">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
          <input
            name="email"
            type="email"
            required
            defaultValue={state.values?.email ?? ""}
            className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-10 pr-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
            placeholder="name@example.com"
          />
        </div>
      </label>
      <label className="block">
        <span className="text-sm font-medium">รหัสผ่าน</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          placeholder="รหัสผ่านของคุณ"
        />
      </label>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-[#8A6500] hover:text-[#111827] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FFD200]/50"
        >
          ลืมรหัสผ่าน?
        </Link>
      </div>
      <SubmitButton />
    </form>
  );
}
