import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { LoginForm } from "@/components/auth/login-form";
import { getRoleHome } from "@/lib/auth/routes";
import { getCurrentProfile } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; returnUrl?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(getRoleHome(profile.role));
  }

  const { message, returnUrl } = await searchParams;
  const safeReturnUrl = returnUrl?.startsWith("/") ? returnUrl : "";

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <section className="grid w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:grid-cols-[1fr_30rem]">
          <div className="hidden bg-[#111827] p-10 text-white lg:block">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white p-1.5">
                <Image src="/images/nt-logo.png" alt="NT" width={36} height={36} className="h-full w-full object-contain" priority />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#FFD200]">NT AI</p>
                <p className="font-semibold">Digital Mediation Platform</p>
              </div>
            </Link>
            <Link href="/" className="mt-12 inline-flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white">
              <ArrowLeft className="size-4" aria-hidden="true" />
              กลับหน้าแรก
            </Link>
            <h1 className="mt-10 text-4xl font-semibold tracking-tight">
              เข้าสู่ระบบพอร์ตัลไกล่เกลี่ยดิจิทัล
            </h1>
            <p className="mt-4 max-w-md leading-7 text-white/70">
              ใช้อีเมลและรหัสผ่านเพื่อเข้าสู่พื้นที่ทำงานตามบทบาทของคุณ ระบบจะพาไปยังพอร์ตัลที่ถูกต้องโดยอัตโนมัติ
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FFF2A8]">
              <LockKeyhole className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">เข้าสู่ระบบ</h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              เข้าสู่ระบบด้วย Supabase Auth แบบอีเมลและรหัสผ่าน
            </p>

            {message ? (
              <div className="mt-5 rounded-lg border border-[#F5B800]/30 bg-[#FFF8D9] px-4 py-3 text-sm text-[#6B4F00]">
                {message}
              </div>
            ) : null}

            <div className="mt-6">
              <GoogleOAuthButton label="เข้าสู่ระบบด้วย Google" returnUrl={safeReturnUrl} />
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="text-xs text-[#6B7280]">หรือใช้อีเมล</span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            <LoginForm returnUrl={safeReturnUrl} />

            <p className="mt-6 text-center text-sm text-[#6B7280]">
              ยังไม่มีบัญชี?{" "}
              <Link href={`/register${safeReturnUrl ? `?returnUrl=${encodeURIComponent(safeReturnUrl)}` : ""}`} className="font-semibold text-[#8A6500] hover:text-[#111827]">
                สร้างบัญชีใหม่
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
