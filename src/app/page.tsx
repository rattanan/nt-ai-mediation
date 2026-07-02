import { CalendarCheck2, CheckCircle2, LayoutDashboard, MessageSquareText, ShieldCheck, Users2 } from "lucide-react";
import { AppFooter, AppHeader, FeatureCard, HeroSection, PortalCard, WorkflowStep } from "@/components/site-components";
import Link from "next/link";

const features = [
  {
    title: "AI Interview",
    description: "สัมภาษณ์ลูกหนี้อัตโนมัติด้วยคำถามเชิงโครงสร้างและสรุปประเด็นสำคัญ",
    icon: MessageSquareText,
  },
  {
    title: "Mediator Matching",
    description: "จับคู่ผู้ไกล่เกลี่ยตามประเภทข้อพิพาท ความพร้อม และภาระงาน",
    icon: Users2,
  },
  {
    title: "Online Appointment",
    description: "นัดหมายการไกล่เกลี่ยออนไลน์ ลดขั้นตอนและติดตามสถานะได้ทันที",
    icon: CalendarCheck2,
  },
  {
    title: "Settlement Tracking",
    description: "ติดตามข้อตกลง เงื่อนไขผ่อนชำระ และสถานะการปิดเรื่องแบบโปร่งใส",
    icon: CheckCircle2,
  },
  {
    title: "Creditor Dashboard",
    description: "มุมมองภาพรวมสำหรับเจ้าหนี้ ดูคดีคงค้าง แนวโน้ม และผลลัพธ์การเจรจา",
    icon: LayoutDashboard,
  },
  {
    title: "Admin KPI & Audit",
    description: "แดชบอร์ดผู้ดูแลระบบพร้อม KPI, audit trail และการควบคุมคุณภาพงาน",
    icon: ShieldCheck,
  },
];

const workflowSteps = ["Register", "AI Interview", "Matching", "Appointment", "Mediation", "Settlement"];

const portals = [
  {
    title: "Debtor Portal",
    description: "ลงทะเบียน แจ้งข้อมูลหนี้ และเริ่มกระบวนการไกล่เกลี่ยด้วยตัวเอง",
    href: "/debtor",
    accent: "from-[#fff7c2] to-white",
  },
  {
    title: "Mediator Portal",
    description: "คิวงาน สรุปเคส และเครื่องมือช่วยจัดการการไกล่เกลี่ย",
    href: "/mediator",
    accent: "from-white to-[#fff4b3]",
  },
  {
    title: "Creditor Portal",
    description: "ติดตามสถานะลูกหนี้ ผลการนัดหมาย และรายงานการปิดเรื่อง",
    href: "/creditor",
    accent: "from-[#fff8d9] to-white",
  },
  {
    title: "Admin Portal",
    description: "ภาพรวมระบบ KPI, compliance และ audit สำหรับทีมกำกับดูแล",
    href: "/admin",
    accent: "from-white to-[#fff5c4]",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-[#1F2937]">
      <AppHeader />
      <main>
        <HeroSection />
        <section className="bg-[#F7F7F7]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#F5B800]">
                Core capabilities
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-[#1F2937]">
                เครื่องมือหลักสำหรับกระบวนการไกล่เกลี่ย
              </h2>
            </div>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {features.map((feature) => (
                <FeatureCard key={feature.title} {...feature} />
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#F5B800]">
                  Portal previews
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#1F2937]">
                  หน้าพอร์ตัลตัวอย่างสำหรับแต่ละบทบาท
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-[#6B7280]">
                โครงหน้าแยกตามบทบาทช่วยให้ขยายฟีเจอร์ในอนาคตได้ง่ายโดยไม่กระทบประสบการณ์ของผู้ใช้แต่ละกลุ่ม
              </p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              {portals.map((portal) => (
                <PortalCard key={portal.title} {...portal} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F7F7F7]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="rounded-[2rem] border border-black/5 bg-white p-8 shadow-sm">
              <div className="max-w-2xl">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#F5B800]">
                  Workflow
                </p>
                <h2 className="mt-3 text-3xl font-semibold text-[#1F2937]">
                  ขั้นตอนการทำงานที่เข้าใจง่าย
                </h2>
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {workflowSteps.map((step, index) => (
                  <WorkflowStep key={step} step={step} index={index} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
            <div className="rounded-[2rem] bg-gradient-to-r from-[#FFD200] to-[#F5B800] p-8 text-[#1F2937] shadow-lg shadow-[#FFD200]/20">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#1F2937]/80">
                    Next phase
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold">
                    พร้อมต่อยอดเข้าสู่ authentication และ integration
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[#1F2937]/75">
                    ตอนนี้เราเน้นการสร้างประสบการณ์หน้าเว็บที่สวยและ responsive ก่อน จากนั้นจึง
                    เชื่อม Supabase auth และ data flow ในรอบถัดไป
                  </p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href="/debtor"
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#1F2937] transition hover:bg-[#FFF9D8]"
                  >
                    ดู Debtor Portal
                  </Link>
                  <Link
                    href="/admin"
                    className="inline-flex items-center justify-center rounded-full border border-[#1F2937]/10 bg-[#1F2937] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#111827]"
                  >
                    ดู Admin Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
