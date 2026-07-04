import Link from "next/link";
import Image from "next/image";
import { MailCheck } from "lucide-react";
import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; message?: string; status?: string }>;
}) {
  const { email = "", message, status } = await searchParams;
  const isRegisteredSuccess = status === "registered";

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
            <h1 className="mt-16 text-4xl font-semibold tracking-tight">ยืนยันอีเมลเพื่อเปิดใช้งานบัญชี</h1>
            <p className="mt-4 max-w-md leading-7 text-white/70">
              เพื่อความปลอดภัย ผู้สมัครด้วยอีเมลและรหัสผ่านต้องยืนยันอีเมลก่อนเข้าสู่พอร์ตัล
            </p>
          </div>

          <div className="flex items-center p-6 sm:p-8">
            <Card className="w-full border-0 shadow-none">
              <CardHeader className="px-0">
                <Badge className="mb-4 w-fit">
                  {isRegisteredSuccess ? "ลงทะเบียนสำเร็จ" : "รอการยืนยันอีเมล"}
                </Badge>
                <div className="mb-4 flex size-12 items-center justify-center rounded-lg bg-[#FFF2A8]">
                  <MailCheck className="size-5" aria-hidden="true" />
                </div>
                <CardTitle>
                  {isRegisteredSuccess ? "✅ ลงทะเบียนสำเร็จ" : "กรุณาตรวจสอบอีเมลของคุณ"}
                </CardTitle>
                <CardDescription>
                  {isRegisteredSuccess
                    ? "กรุณาตรวจสอบอีเมลของคุณ และคลิกลิงก์ยืนยันตัวตนก่อนเข้าสู่ระบบ"
                    : "กรุณาตรวจสอบอีเมลของคุณเพื่อยืนยันบัญชี ก่อนเข้าสู่ระบบ"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-0">
                {message ? <Alert>{message}</Alert> : null}
                <VerifyEmailForm initialEmail={email} />
                <Button href="/login" variant="outline" className="h-11 w-full rounded-lg font-semibold">
                  {isRegisteredSuccess ? "ตกลง" : "กลับไปหน้าเข้าสู่ระบบ"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
