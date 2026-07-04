import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrustScoreBadge } from "@/components/mediator/trust-score-badge";
import { jsonList } from "@/lib/mediators";
import type { TopTrustedMediator } from "@/lib/trust-score";

export function PublicMediatorCard({ mediator }: { mediator: TopTrustedMediator }) {
  const score = mediator.mediator_trust_scores?.[0] ?? null;
  const settlementRate = mediator.total_cases_handled > 0 ? Math.round((mediator.successful_cases / mediator.total_cases_handled) * 100) : 0;

  return (
    <article className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-[#FFF2A8]">
          {mediator.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediator.profile_photo_url} alt="" className="h-full w-full object-cover" />
          ) : <span className="font-semibold text-[#8A6500]">{mediator.first_name.slice(0, 1)}</span>}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold">{mediator.title ?? ""} {mediator.first_name} {mediator.last_name}</h3>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          </div>
          <p className="mt-1 text-sm text-[#6B7280]">{mediator.province || "ออนไลน์"}</p>
        </div>
      </div>
      <div className="mt-4"><TrustScoreBadge score={score} /></div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-[#6B7280]">ประสบการณ์</dt><dd className="font-semibold">{mediator.mediation_experience_years} ปี</dd></div>
        <div><dt className="text-[#6B7280]">เคสสำเร็จ</dt><dd className="font-semibold">{settlementRate}%</dd></div>
        <div><dt className="text-[#6B7280]">เคสทั้งหมด</dt><dd className="font-semibold">{mediator.total_cases_handled}</dd></div>
        <div><dt className="text-[#6B7280]">Rating</dt><dd className="font-semibold">{score?.average_rating?.toFixed(1) ?? "0.0"}</dd></div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#4B5563]">
        {jsonList(mediator.languages).slice(0, 3).map((language) => <span key={language} className="rounded-full bg-[#F3F4F6] px-2 py-1">{language}</span>)}
        {mediator.online_mediation_available ? <span className="rounded-full bg-[#FFF8D9] px-2 py-1">Online</span> : null}
      </div>
      <Button type="button" disabled variant="outline" className="mt-5 h-10 w-full rounded-lg">View Profile</Button>
    </article>
  );
}
