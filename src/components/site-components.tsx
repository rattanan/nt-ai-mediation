import Link from "next/link";
import type { ComponentType } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFD200] text-[#1F2937] shadow-sm shadow-[#FFD200]/30">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5B800]">
              NT AI Platform
            </p>
            <p className="text-sm font-semibold text-[#1F2937]">
              NT AI Digital Mediation Platform
            </p>
          </div>
        </Link>
        <nav className="hidden items-center gap-2 md:flex">
          {[
            ["หน้าแรก", "/"],
            ["ลูกหนี้", "/debtor"],
            ["ผู้ไกล่เกลี่ย", "/mediator"],
            ["เจ้าหนี้", "/creditor"],
            ["ผู้ดูแลระบบ", "/admin"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-full px-4 py-2 text-sm font-medium text-[#374151] transition hover:bg-[#FFF7D1] hover:text-[#1F2937]"
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function AppFooter() {
  return (
    <footer className="border-t border-black/5 bg-[#F7F7F7]">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-end lg:justify-between lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#F5B800]">
            National Telecom
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1F2937]">
            NT AI Digital Mediation Platform
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#4B5563]">
            แพลตฟอร์มต้นแบบสำหรับการไกล่เกลี่ยข้อพิพาทด้านหนี้ด้วย AI รองรับการใช้งาน
            แบบองค์กรและภาครัฐอย่างเป็นระบบ
          </p>
        </div>
        <div className="grid gap-2 text-sm text-[#4B5563] sm:grid-cols-2">
          <p>Thai-first public sector UX</p>
          <p>Google Cloud Run deployment ready</p>
          <p>Supabase client prepared</p>
          <p>Responsive enterprise interface</p>
        </div>
      </div>
    </footer>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,210,0,0.35),transparent_38%),radial-gradient(circle_at_top_right,rgba(245,184,0,0.18),transparent_34%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#FFD200]/40 bg-white px-4 py-2 text-sm font-medium text-[#1F2937] shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FFD200]" />
            Digital mediation workflow for debt resolution
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#1F2937] sm:text-5xl lg:text-6xl">
            NT AI Digital Mediation Platform
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#4B5563] sm:text-xl">
            แพลตฟอร์มไกล่เกลี่ยข้อพิพาทด้านหนี้ด้วย AI ที่ออกแบบมาให้เป็นมิตรกับผู้ใช้งาน
            รองรับเจ้าหน้าที่ ลูกหนี้ เจ้าหนี้ และผู้ดูแลระบบในภาพลักษณ์องค์กรที่เชื่อถือได้
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/debtor"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFD200] px-6 py-3 text-sm font-semibold text-[#1F2937] shadow-lg shadow-[#FFD200]/30 transition hover:-translate-y-0.5 hover:bg-[#F5B800]"
            >
              เริ่มลงทะเบียนลูกหนี้
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/mediator"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[#D1D5DB] bg-white px-6 py-3 text-sm font-semibold text-[#1F2937] transition hover:border-[#F5B800] hover:bg-[#FFFBEA]"
            >
              เข้าสู่ระบบผู้ไกล่เกลี่ย
            </Link>
          </div>
        </div>

        <div className="grid gap-4 self-center">
          <div className="rounded-[2rem] border border-[#E5E7EB] bg-white p-6 shadow-[0_20px_60px_rgba(31,41,55,0.08)]">
            <p className="text-sm font-semibold text-[#F5B800]">Workflow overview</p>
            <div className="mt-4 space-y-4">
              {["Register", "AI Interview", "Matching", "Appointment", "Mediation", "Settlement"].map(
                (step, index, steps) => (
                  <div key={step} className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFF3B0] text-sm font-semibold text-[#1F2937]">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[#1F2937]">{step}</p>
                      <p className="text-sm text-[#6B7280]">
                        {index === 0
                          ? "ลงทะเบียนและเริ่มต้นเคส"
                          : index === steps.length - 1
                            ? "บันทึกผลลัพธ์และปิดเรื่อง"
                            : "เชื่อมต่อขั้นตอนการดำเนินงาน"}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="rounded-[2rem] border border-[#E5E7EB] bg-[#1F2937] p-6 text-white shadow-[0_20px_60px_rgba(31,41,55,0.12)]">
            <p className="text-sm font-semibold text-[#FFD200]">Enterprise readiness</p>
            <p className="mt-3 text-xl font-semibold">สอดคล้องกับการใช้งานระดับองค์กรและภาครัฐ</p>
            <p className="mt-2 text-sm leading-6 text-white/75">
              โครงสร้างหน้าจอพร้อมต่อยอด authentication, role-based access และ Supabase backend
              ในเฟสถัดไป
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function FeatureCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="group rounded-[1.75rem] border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF2A8] text-[#1F2937] transition group-hover:bg-[#FFD200]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-[#1F2937]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#4B5563]">{description}</p>
    </div>
  );
}

export function WorkflowStep({
  step,
  index,
}: {
  step: string;
  index: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#E5E7EB] bg-white px-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFD200] font-semibold text-[#1F2937]">
        {index + 1}
      </div>
      <p className="font-medium text-[#1F2937]">{step}</p>
    </div>
  );
}

export function PortalCard({
  title,
  description,
  href,
  accent,
}: {
  title: string;
  description: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`group rounded-[2rem] border border-[#E5E7EB] bg-gradient-to-br ${accent} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#F5B800]">
            Portal preview
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-[#1F2937]">{title}</h3>
        </div>
        <div className="rounded-full bg-white/80 p-3 text-[#1F2937] shadow-sm transition group-hover:bg-[#FFD200]">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-4 max-w-md text-sm leading-6 text-[#4B5563]">{description}</p>
    </Link>
  );
}
