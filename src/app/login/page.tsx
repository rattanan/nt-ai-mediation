import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, LockKeyhole, Mail, Sparkles } from "lucide-react";
import { login } from "@/app/auth/actions";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { getRoleHome } from "@/lib/auth/routes";
import { getCurrentProfile } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const profile = await getCurrentProfile();

  if (profile) {
    redirect(getRoleHome(profile.role));
  }

  const { message } = await searchParams;

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <section className="grid w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm lg:grid-cols-[1fr_30rem]">
          <div className="hidden bg-[#111827] p-10 text-white lg:block">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FFD200] text-[#111827]">
                <Sparkles className="h-5 w-5" />
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
              <GoogleOAuthButton label="เข้าสู่ระบบด้วย Google" />
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="text-xs text-[#6B7280]">หรือใช้อีเมล</span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            <form action={login} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium">อีเมล</span>
                <div className="relative mt-2">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    name="email"
                    type="email"
                    required
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
              <button
                type="submit"
                className="h-11 w-full rounded-lg bg-[#FFD200] px-4 text-sm font-semibold text-[#111827] hover:bg-[#F5B800]"
              >
                เข้าสู่ระบบ
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#6B7280]">
              ยังไม่มีบัญชี?{" "}
              <Link href="/register" className="font-semibold text-[#8A6500] hover:text-[#111827]">
                สร้างบัญชีใหม่
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
