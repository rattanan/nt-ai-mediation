import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { AppFooter, AppHeader } from "@/components/site-components";

export function PortalPage({
  title,
  description,
  icon: Icon,
  highlights,
  accentClass,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  highlights: string[];
  accentClass: string;
}) {
  return (
    <div className="min-h-screen bg-white text-[#1F2937]">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <section className={`rounded-[2.25rem] border border-black/5 ${accentClass} p-8 shadow-sm`}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#F5B800] shadow-sm">
                <Icon className="h-4 w-4" />
                Portal preview
              </div>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
              <p className="mt-4 text-lg leading-8 text-[#4B5563]">{description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="rounded-full bg-[#1F2937] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                >
                  กลับหน้าแรก
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-[#D1D5DB] bg-white px-5 py-3 text-sm font-semibold text-[#1F2937] transition hover:bg-[#FFFBEA]"
                >
                  ดูภาพรวมแพลตฟอร์ม
                </Link>
              </div>
            </div>

            <div className="grid gap-4 rounded-[2rem] bg-white p-6 shadow-sm lg:w-[24rem]">
              {highlights.map((item, index) => (
                <div key={item} className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD200] font-semibold">
                    {index + 1}
                  </div>
                  <p className="text-sm font-medium text-[#1F2937]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <AppFooter />
    </div>
  );
}
