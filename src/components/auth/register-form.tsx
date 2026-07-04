"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { register } from "@/app/auth/actions";
import { emptyFormState } from "@/lib/form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 w-full rounded-lg bg-[#FFD200] px-4 text-sm font-semibold hover:bg-[#F5B800] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(register, emptyFormState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      {state.error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-medium">ชื่อ-นามสกุล</span>
        <input
          name="full_name"
          required
          defaultValue={state.values?.full_name ?? ""}
          className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          placeholder="ชื่อผู้ใช้งาน"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">อีเมล</span>
        <input
          name="email"
          type="email"
          required
          defaultValue={state.values?.email ?? ""}
          className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          placeholder="name@example.com"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">รหัสผ่าน</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          placeholder="อย่างน้อย 6 ตัวอักษร"
        />
      </label>
      <label className="block">
        <span className="text-sm font-medium">บทบาท</span>
        <select
          name="role"
          defaultValue={state.values?.role ?? "debtor"}
          className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
        >
          <option value="debtor">ลูกหนี้</option>
          <option value="mediator">ผู้ไกล่เกลี่ย</option>
          <option value="creditor">เจ้าหนี้</option>
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">หน่วยงาน/องค์กร (ถ้ามี)</span>
        <input
          name="organization_name"
          defaultValue={state.values?.organization_name ?? ""}
          className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          placeholder="เช่น บริษัท หรือหน่วยงาน"
        />
      </label>
      <SubmitButton />
    </form>
  );
}
