import Link from "next/link";
import { Award, BriefcaseBusiness, CheckCircle2, Globe2, MapPin, Scale, ShieldCheck, Sparkles, Star } from "lucide-react";
import { choosePublicMediator } from "./actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { jsonList } from "@/lib/json-list";
import { PublicMediatorsHeader } from "@/components/mediators/public-header";
import { getPage, paginateItems, Pagination } from "@/components/ui/pagination";

export const dynamic = "force-dynamic";

export default async function PublicMediatorsPage({ searchParams }: { searchParams: Promise<{ error?: string; expertise?: string; page?: string }> }) {
  const { error, expertise = "", page: pageParam } = await searchParams;
  const supabase = createAdminClient();
  const { data } = await supabase.from("mediator_profiles")
    .select("id, title, first_name, last_name, profile_photo_url, province, mediation_experience_years, total_cases_handled, successful_cases, expertise_areas, debt_types_supported, languages, online_mediation_available, onsite_mediation_available, profile_summary, mediator_registration_authority, mediator_trust_scores(overall_score, average_rating, review_count, badge_code)")
    .eq("status", "approved").order("mediation_experience_years", { ascending: false });
  const mediators = (data ?? []).filter((item) => !expertise || [...jsonList(item.expertise_areas), ...jsonList(item.debt_types_supported)].some((value) => value.toLowerCase().includes(expertise.toLowerCase())));
  const expertiseOptions = [...new Set((data ?? []).flatMap((item) => [...jsonList(item.expertise_areas), ...jsonList(item.debt_types_supported)]))].slice(0, 12);
  const { page, pageItems: pagedMediators, total } = paginateItems(mediators, getPage(pageParam), 6);

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <PublicMediatorsHeader />

      <section className="relative overflow-hidden bg-[#111827] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,210,0,.22),transparent_42%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-[#FFE76B]"><Sparkles className="h-4 w-4" /> คนที่ใช่ เปลี่ยนการเจรจาให้เป็นทางออก</span>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">เลือกผู้ไกล่เกลี่ยที่เข้าใจทั้งเรื่องหนี้ และเรื่องของคุณ</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-white/70">ทุกโปรไฟล์ผ่านการตรวจสอบจากระบบ พร้อมประสบการณ์ ความเชี่ยวชาญ และรูปแบบบริการที่โปร่งใส เพื่อให้คุณเริ่มต้นการเจรจาด้วยความมั่นใจ</p>
          <div className="mt-8 flex flex-wrap gap-4 text-sm text-white/80">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#FFD200]" /> ผ่านการรับรอง</span>
            <span className="inline-flex items-center gap-2"><Scale className="h-5 w-5 text-[#FFD200]" /> เป็นกลางและเป็นธรรม</span>
            <span className="inline-flex items-center gap-2"><Globe2 className="h-5 w-5 text-[#FFD200]" /> รองรับการไกล่เกลี่ยออนไลน์</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {error ? <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-sm font-semibold text-[#A87900]">ผู้เชี่ยวชาญที่พร้อมรับฟัง</p><h2 className="mt-2 text-3xl font-bold">พบผู้ไกล่เกลี่ย {mediators.length} คน</h2></div>
          <form className="flex gap-2">
            <select name="expertise" defaultValue={expertise} className="h-11 min-w-64 rounded-xl border border-black/10 bg-white px-3 text-sm">
              <option value="">ความเชี่ยวชาญทั้งหมด</option>
              {expertiseOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <button className="h-11 rounded-xl bg-[#111827] px-5 text-sm font-semibold text-white">ค้นหา</button>
          </form>
        </div>

        <section className="grid gap-6 lg:grid-cols-2">
          {pagedMediators.map((mediator) => {
            const score = (mediator.mediator_trust_scores as unknown as Array<{ average_rating: number; overall_score: number; review_count: number }> | null)?.[0];
            const successRate = mediator.total_cases_handled ? Math.round(mediator.successful_cases / mediator.total_cases_handled * 100) : 0;
            const expertiseList = [...new Set([...jsonList(mediator.expertise_areas), ...jsonList(mediator.debt_types_supported)])];
            return (
              <article key={mediator.id} className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                <div className="flex gap-5">
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF2A8] text-2xl font-bold text-[#8A6500]">
                    {mediator.profile_photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={mediator.profile_photo_url} alt={`${mediator.first_name} ${mediator.last_name}`} className="h-full w-full object-cover" />
                    ) : mediator.first_name.slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2"><h3 className="text-xl font-bold">{mediator.title} {mediator.first_name} {mediator.last_name}</h3><CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" /></div>
                    <p className="mt-2 flex items-center gap-2 text-sm text-[#6B7280]"><MapPin className="h-4 w-4" /> {mediator.province || "ให้บริการออนไลน์ทั่วประเทศ"}</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#8A6500]"><Award className="h-4 w-4" /> {mediator.mediator_registration_authority || "ผู้ไกล่เกลี่ยที่ผ่านการรับรอง"}</p>
                  </div>
                </div>
                <p className="mt-5 line-clamp-3 text-sm leading-7 text-[#4B5563]">{mediator.profile_summary || "พร้อมรับฟังทุกมุมมอง วิเคราะห์ปัญหาอย่างเป็นกลาง และช่วยออกแบบข้อตกลงที่ทุกฝ่ายสามารถเดินหน้าต่อได้"}</p>
                <div className="mt-5 flex flex-wrap gap-2">{expertiseList.slice(0, 5).map((item) => <span key={item} className="rounded-full bg-[#FFF8D9] px-3 py-1.5 text-xs font-semibold text-[#6B4F00]">{item}</span>)}</div>
                <dl className="mt-6 grid grid-cols-3 gap-3 border-y border-black/5 py-4 text-center">
                  <div><dt className="text-xs text-[#6B7280]">ประสบการณ์</dt><dd className="mt-1 font-bold">{mediator.mediation_experience_years} ปี</dd></div>
                  <div><dt className="text-xs text-[#6B7280]">ผลสำเร็จ</dt><dd className="mt-1 font-bold">{successRate}%</dd></div>
                  <div><dt className="text-xs text-[#6B7280]">คะแนนรีวิว</dt><dd className="mt-1 flex items-center justify-center gap-1 font-bold"><Star className="h-4 w-4 fill-[#FFD200] text-[#D4A900]" /> {score?.average_rating?.toFixed(1) ?? "ใหม่"}</dd></div>
                </dl>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <p className="flex items-center gap-2 text-xs text-[#6B7280]"><BriefcaseBusiness className="h-4 w-4" /> ดูแลแล้ว {mediator.total_cases_handled} เคส</p>
                  <form action={choosePublicMediator}>
                    <input type="hidden" name="mediator_id" value={mediator.id} />
                    <button type="submit" className="rounded-xl bg-[#FFD200] px-5 py-3 text-sm font-bold transition hover:bg-[#F5B800]">เลือกผู้ไกล่เกลี่ยคนนี้</button>
                  </form>
                </div>
              </article>
            );
          })}
        </section>
        <Pagination basePath="/mediators" params={{ expertise }} page={page} pageSize={6} total={total} />
        {mediators.length === 0 ? <div className="rounded-2xl border border-dashed border-black/15 bg-white p-12 text-center"><h2 className="text-xl font-bold">ยังไม่พบผู้ไกล่เกลี่ยในความเชี่ยวชาญนี้</h2><Link href="/mediators" className="mt-4 inline-block font-semibold text-[#8A6500]">ดูผู้ไกล่เกลี่ยทั้งหมด</Link></div> : null}
      </div>
    </main>
  );
}
