import Link from "next/link";
import { UserPlus, Sparkles } from "lucide-react";
import { register } from "@/app/auth/actions";
import { GoogleOAuthButton } from "@/components/auth/google-oauth-button";
import { getCurrentProfile } from "@/lib/auth/server";
import { getRoleHome } from "@/lib/auth/routes";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function RegisterPage({
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
    <main className="min-h-screen bg-[#F7F7F7] text-[#1F2937]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <section className="grid w-full overflow-hidden rounded-lg border border-black/5 bg-white shadow-sm lg:grid-cols-[1fr_30rem]">
          <div className="hidden bg-[#1F2937] p-10 text-white lg:block">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FFD200] text-[#1F2937]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#FFD200]">NT AI</p>
                <p className="font-semibold">Digital Mediation Platform</p>
              </div>
            </Link>
            <h1 className="mt-16 text-4xl font-semibold">สร้างบัญชีตามบทบาทผู้ใช้งาน</h1>
            <p className="mt-4 max-w-md leading-7 text-white/70">
              เลือกบทบาทให้ตรงกับการใช้งาน ระบบจะพาไปยังพอร์ตัลที่เหมาะสมหลังลงทะเบียน
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FFF2A8]">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">ลงทะเบียน</h2>
            <p className="mt-2 text-sm text-[#6B7280]">สร้างบัญชีด้วยอีเมลและรหัสผ่าน</p>

            {message ? (
              <div className="mt-5 rounded-lg border border-[#F5B800]/30 bg-[#FFF8D9] px-4 py-3 text-sm text-[#6B4F00]">
                {message}
              </div>
            ) : null}

            <div className="mt-6">
              <GoogleOAuthButton label="สมัครหรือเข้าสู่ระบบด้วย Google" role="debtor" />
              <p className="mt-2 text-center text-xs text-[#6B7280]">
                การสมัครด้วย Google จะตั้งค่าบทบาทเริ่มต้นเป็นลูกหนี้
              </p>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-[#E5E7EB]" />
              <span className="text-xs text-[#6B7280]">หรือกรอกข้อมูล</span>
              <div className="h-px flex-1 bg-[#E5E7EB]" />
            </div>

            <form action={register} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium">ชื่อ-นามสกุล</span>
                <input
                  name="full_name"
                  required
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
                  defaultValue="debtor"
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
                  className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
                  placeholder="เช่น บริษัท หรือหน่วยงาน"
                />
              </label>
              <button
                type="submit"
                className="h-11 w-full rounded-lg bg-[#FFD200] px-4 text-sm font-semibold hover:bg-[#F5B800]"
              >
                สร้างบัญชี
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#6B7280]">
              มีบัญชีแล้ว?{" "}
              <Link href="/login" className="font-semibold text-[#8A6500] hover:text-[#1F2937]">
                เข้าสู่ระบบ
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
