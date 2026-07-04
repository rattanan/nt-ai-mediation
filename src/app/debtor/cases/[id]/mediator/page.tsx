import { selectMediatorForCase } from "@/app/debtor/cases/[id]/mediator/actions";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/mediator/trust-score-badge";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor } from "@/lib/cases";
import { getApprovedMediatorsForCase, jsonList } from "@/lib/mediators";
import { getMediatorTrustScore } from "@/lib/trust-score";

export const dynamic = "force-dynamic";

export default async function SelectMediatorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const debtor = await requireRole("debtor");
  const { id } = await params;
  const { error } = await searchParams;
  const item = await getCaseForDebtor(id, debtor.id);
  const mediators = await getApprovedMediatorsForCase(item.province, item.debt_type);
  const trustScores = new Map((await Promise.all(mediators.map(async (mediator) => [mediator.id, await getMediatorTrustScore(mediator.id)] as const))));
  const action = selectMediatorForCase.bind(null, item.id);

  return (
    <DebtorShell profile={debtor} activePath="/debtor" title="เลือกผู้ไกล่เกลี่ย" subtitle="แสดงเฉพาะผู้ไกล่เกลี่ยที่ผ่านการอนุมัติและตรงกับพื้นที่หรือให้บริการออนไลน์">
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">เคส {item.case_number}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{item.debt_type} · {item.province} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {mediators.length === 0 ? (
          <div className="rounded-lg border border-black/5 bg-white p-8 text-center shadow-sm lg:col-span-2 xl:col-span-3">
            <p className="font-semibold">ยังไม่มีผู้ไกล่เกลี่ยที่ตรงเงื่อนไข</p>
            <p className="mt-2 text-sm text-[#6B7280]">ผู้ดูแลระบบสามารถอนุมัติโปรไฟล์ผู้ไกล่เกลี่ยเพิ่มเติมได้จากหน้า Admin</p>
          </div>
        ) : mediators.map((mediator) => {
          const successRate = mediator.total_cases_handled > 0 ? Math.round((mediator.successful_cases / mediator.total_cases_handled) * 100) : 0;
          const trustScore = trustScores.get(mediator.id) ?? null;
          return (
            <article key={mediator.id} className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-[#FFF2A8]">
                  {mediator.profile_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediator.profile_photo_url} alt="" className="h-full w-full object-cover" />
                  ) : <span className="font-semibold text-[#8A6500]">{mediator.first_name.slice(0, 1)}</span>}
                </div>
                <div>
                  <h3 className="font-semibold">{mediator.title ?? ""} {mediator.first_name} {mediator.last_name}</h3>
                  <p className="mt-1 text-sm text-[#6B7280]">{mediator.province || "ออนไลน์"}</p>
                </div>
              </div>
              <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#374151]">{mediator.profile_summary || "ไม่มีสรุปโปรไฟล์"}</p>
              <div className="mt-4"><TrustScoreBadge score={trustScore} /></div>
              <div className="mt-4 flex flex-wrap gap-2">
                {jsonList(mediator.expertise_areas).slice(0, 3).map((item) => <Badge key={item}>{item}</Badge>)}
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-[#6B7280]">ประสบการณ์</dt><dd className="font-semibold">{mediator.mediation_experience_years} ปี</dd></div>
                <div><dt className="text-[#6B7280]">Success rate</dt><dd className="font-semibold">{successRate}%</dd></div>
                <div><dt className="text-[#6B7280]">เคสทั้งหมด</dt><dd className="font-semibold">{mediator.total_cases_handled}</dd></div>
                <div><dt className="text-[#6B7280]">รูปแบบ</dt><dd className="font-semibold">{mediator.online_mediation_available ? "Online" : ""}{mediator.onsite_mediation_available ? " / Onsite" : ""}</dd></div>
              </dl>
              <form action={action} className="mt-5">
                <input type="hidden" name="mediator_profile_id" value={mediator.id} />
                <Button type="submit" className="h-11 w-full rounded-lg font-semibold">เลือกผู้ไกล่เกลี่ย</Button>
              </form>
            </article>
          );
        })}
      </section>
    </DebtorShell>
  );
}
