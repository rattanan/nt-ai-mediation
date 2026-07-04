import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, KeyRound } from "lucide-react";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <section className="grid w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:grid-cols-[1fr_30rem]">
          <div className="hidden bg-[#111827] p-10 text-white lg:block">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FFD200] text-[#111827]">
                <Image src="/images/nt-logo.png" alt="NT" width={36} height={36} className="h-9 w-9 object-contain" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#FFD200]">NT AI</p>
                <p className="font-semibold">Digital Mediation Platform</p>
              </div>
            </Link>
            <Link
              href="/login"
              className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#FFD200]/50"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              กลับเข้าสู่ระบบ
            </Link>
            <h1 className="mt-10 text-4xl font-semibold tracking-tight">รีเซ็ตรหัสผ่านอย่างปลอดภัย</h1>
            <p className="mt-4 max-w-md leading-7 text-white/70">
              ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ โดยไม่เปิดเผยว่าอีเมลนั้นมีอยู่ในระบบหรือไม่
            </p>
          </div>

          <div className="flex items-center p-6 sm:p-8">
            <Card className="w-full border-0 shadow-none">
              <CardHeader className="px-0">
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#FFF2A8]">
                  <KeyRound className="size-5" aria-hidden="true" />
                </div>
                <CardTitle>ลืมรหัสผ่าน?</CardTitle>
                <CardDescription>
                  กรอกอีเมลที่ใช้สมัครบัญชีเพื่อรับลิงก์รีเซ็ตรหัสผ่าน
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <ForgotPasswordForm />
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
