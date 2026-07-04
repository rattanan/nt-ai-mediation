import Link from "next/link";
import Image from "next/image";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function EmailConfirmedPage() {
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
            <h1 className="mt-16 text-4xl font-semibold tracking-tight">บัญชีพร้อมใช้งานแล้ว</h1>
            <p className="mt-4 max-w-md leading-7 text-white/70">
              คุณสามารถเข้าสู่ระบบและใช้งานพอร์ตัลตามบทบาทของคุณได้ทันที
            </p>
          </div>

          <div className="flex items-center p-6 sm:p-8">
            <Card className="w-full border-0 shadow-none">
              <CardHeader className="items-center px-0 text-center">
                <Badge className="mb-4">ยืนยันสำเร็จ</Badge>
                <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-8" aria-hidden="true" />
                </div>
                <CardTitle>ยืนยันอีเมลสำเร็จ</CardTitle>
                <CardDescription>
                  บัญชีของคุณได้รับการยืนยันแล้ว กรุณาเข้าสู่ระบบเพื่อไปยังพอร์ตัล
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0">
                <Button href="/login" className="h-11 w-full rounded-lg font-semibold">
                  กลับไปหน้าเข้าสู่ระบบ
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
