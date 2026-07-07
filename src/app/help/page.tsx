import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { audienceLabels, helpArticles, listHelpArticles, releaseNotes, type HelpAudience } from "@/lib/help-center";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Help Center | NT AI Digital Mediation Platform",
  description: "บทความช่วยเหลือ FAQ และคู่มือการใช้งาน NT AI Digital Mediation Platform",
};

const audienceOptions: Array<{ value: "" | HelpAudience; label: string }> = [
  { value: "", label: "ทั้งหมด" },
  { value: "debtor", label: "ลูกหนี้" },
  { value: "creditor", label: "เจ้าหนี้" },
  { value: "mediator", label: "ผู้ไกล่เกลี่ย" },
  { value: "admin", label: "ผู้ดูแลระบบ" },
];

export default async function HelpCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; audience?: HelpAudience }>;
}) {
  const { q = "", audience = "" } = await searchParams;
  const selectedAudience = audienceOptions.some((item) => item.value === audience) ? audience : "";
  const articles = listHelpArticles({ audience: selectedAudience, query: q });
  const categories = Array.from(new Set(helpArticles.map((article) => article.category)));

  return (
    <main className="min-h-screen bg-[#F7F7F7] text-[#111827]">
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <Link href="/" className="text-sm font-semibold text-[#8A6500] hover:text-[#111827]">กลับหน้าแรก</Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <Badge>Help Center</Badge>
              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                ศูนย์ช่วยเหลือ NT AI Digital Mediation Platform
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#4B5563]">
                รวมบทความ FAQ และคู่มือใช้งานล่าสุดเกี่ยวกับการไกล่เกลี่ยหนี้ นัดหมาย เอกสารลงนาม LINE Chatbot และการดูแลระบบ
              </p>
            </div>
            <div className="rounded-2xl border border-[#F5B800]/30 bg-[#FFF8D9] p-5">
              <p className="text-sm font-semibold text-[#6B4F00]">อัปเดตล่าสุด</p>
              <h2 className="mt-2 font-semibold">{releaseNotes[0]?.title}</h2>
              <p className="mt-1 text-sm text-[#6B7280]">Version {releaseNotes[0]?.version} · {releaseNotes[0]?.date}</p>
            </div>
          </div>

          <form className="mt-8 grid gap-3 rounded-2xl border border-black/5 bg-[#F8FAFC] p-4 shadow-sm md:grid-cols-[1fr_13rem_auto]">
            <label className="sr-only" htmlFor="help-search">ค้นหาบทความ</label>
            <input
              id="help-search"
              name="q"
              defaultValue={q}
              className="h-11 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-3 focus:ring-[#FFD200]/40"
              placeholder="ค้นหา เช่น เลื่อนนัด, settlement, LINE Chatbot"
            />
            <label className="sr-only" htmlFor="help-audience">บทบาท</label>
            <select
              id="help-audience"
              name="audience"
              defaultValue={selectedAudience}
              className="h-11 rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-3 focus:ring-[#FFD200]/40"
            >
              {audienceOptions.map((option) => (
                <option key={option.value || "all"} value={option.value}>{option.label}</option>
              ))}
            </select>
            <Button type="submit" className="h-11 rounded-lg font-semibold">ค้นหา</Button>
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[15rem_1fr]">
        <aside className="space-y-5">
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">หมวดหมู่</h2>
            <div className="mt-3 flex flex-wrap gap-2 lg:flex-col">
              {categories.map((category) => (
                <span key={category} className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#4B5563]">{category}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">Release Notes</h2>
            <div className="mt-3 space-y-3">
              {releaseNotes.map((note) => (
                <article key={note.version} className="rounded-lg bg-[#F8FAFC] p-3">
                  <p className="text-sm font-semibold">{note.version}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{note.date}</p>
                  <ul className="mt-2 space-y-1 text-xs leading-5 text-[#4B5563]">
                    {note.items.slice(0, 3).map((item) => <li key={item}>- {item}</li>)}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[#6B7280]">พบ {articles.length.toLocaleString("th-TH")} บทความ</p>
            {q || selectedAudience ? (
              <Link href="/help" className="text-sm font-semibold text-[#8A6500] hover:text-[#111827]">ล้างตัวกรอง</Link>
            ) : null}
          </div>
          <div className="grid gap-4">
            {articles.length === 0 ? (
              <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
                <h2 className="font-semibold">ไม่พบบทความที่ตรงกับคำค้นหา</h2>
                <p className="mt-2 text-sm text-[#6B7280]">ลองค้นด้วยคำว่า นัดหมาย, ลงนาม, ส่วนลด, consent หรือ LINE Chatbot</p>
              </div>
            ) : articles.map((article) => (
              <Link
                key={article.slug}
                href={`/help/${article.slug}`}
                className="group rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#F5B800]/40 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{article.category}</Badge>
                  <span className="text-xs text-[#6B7280]">{article.readingMinutes} นาที</span>
                  <span className="text-xs text-[#6B7280]">อัปเดต {article.updatedAt}</span>
                </div>
                <h2 className="mt-3 text-xl font-semibold group-hover:text-[#8A6500]">{article.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#4B5563]">{article.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {article.audience.map((item) => (
                    <span key={item} className="rounded-full bg-[#F8FAFC] px-3 py-1 text-xs font-medium text-[#4B5563]">{audienceLabels[item]}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
