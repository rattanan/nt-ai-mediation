"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2 } from "lucide-react";

type CampaignCard = {
  id: string;
  organizationName: string;
  organizationLogoUrl: string | null;
  title: string;
  description: string;
  benefits: string[];
  conditions: string[];
  buttonText: string;
};

export function ParticipatingCreditors() {
  const [campaigns, setCampaigns] = useState<CampaignCard[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/public/campaigns")
      .then((response) => response.json())
      .then((payload: { campaigns?: CampaignCard[] }) => {
        if (active) {
          setCampaigns(payload.campaigns ?? []);
        }
      })
      .catch(() => {
        if (active) {
          setCampaigns([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (campaigns.length === 0) {
    return null;
  }

  return (
    <section className="bg-[#F8FAFC] px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#A87900]">Participating Creditors</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] md:text-4xl">
            เจ้าหนี้ที่เข้าร่วมโครงการไกล่เกลี่ยดิจิทัล
          </h2>
          <p className="mt-4 text-base leading-7 text-[#4B5563]">
            เลือกโครงการที่ตรงกับประเภทหนี้ของคุณ แล้วเริ่มกรอกคำขอไกล่เกลี่ยผ่านระบบได้ทันที
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <article key={campaign.id} className="flex min-h-full flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#F5B800]/30 bg-[#FFF8D9]">
                  {campaign.organizationLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={campaign.organizationLogoUrl} alt="" className="h-full w-full object-contain p-2" />
                  ) : (
                    <Building2 className="h-7 w-7 text-[#A87900]" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#6B7280]">{campaign.organizationName}</p>
                  <h3 className="mt-1 text-lg font-semibold text-[#111827]">{campaign.title}</h3>
                </div>
              </div>

              <p className="mt-5 line-clamp-3 text-sm leading-6 text-[#4B5563]">{campaign.description}</p>

              <div className="mt-5 space-y-2">
                {campaign.benefits.slice(0, 3).map((benefit) => (
                  <p key={benefit} className="flex gap-2 text-sm text-[#374151]">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {benefit}
                  </p>
                ))}
              </div>

              {campaign.conditions.length > 0 ? (
                <p className="mt-4 rounded-lg bg-[#F8FAFC] p-3 text-xs leading-5 text-[#6B7280]">
                  เงื่อนไข: {campaign.conditions.slice(0, 2).join(" / ")}
                </p>
              ) : null}

              <div className="mt-auto flex gap-3 pt-6">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-[#E5E7EB] px-4 text-sm font-semibold text-[#111827] hover:bg-[#F8FAFC]"
                >
                  รายละเอียด
                </Link>
                <Link
                  href={`/campaigns/${campaign.id}/apply`}
                  className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#FFD200] px-4 text-sm font-semibold text-[#111827] hover:bg-[#F5B800]"
                >
                  {campaign.buttonText || "สมัคร"}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
