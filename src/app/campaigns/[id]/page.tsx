import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublishedCampaign, jsonList } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getPublishedCampaign(id);
  const organization = campaign.creditor_organizations;
  const benefits = jsonList(campaign.benefits);
  const conditions = jsonList(campaign.conditions);
  const requiredDocuments = jsonList(campaign.required_documents);
  const faqs = Array.isArray(campaign.faqs) ? campaign.faqs : [];

  return (
    <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_28rem] lg:py-14">
          <div>
            <Link href="/" className="text-sm font-semibold text-[#8A6500] hover:text-[#111827]">
              กลับหน้าแรก
            </Link>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-[#F5B800]/30 bg-[#FFF8D9]">
                {organization?.logo_url || organization?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={organization.logo_url ?? organization.logo ?? ""} alt="" className="h-full w-full object-contain p-3" />
                ) : (
                  <Building2 className="h-9 w-9 text-[#A87900]" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#6B7280]">{organization?.organization_name}</p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">{campaign.title}</h1>
              </div>
            </div>
            {campaign.subtitle ? <p className="mt-6 max-w-3xl text-xl leading-8 text-[#4B5563]">{campaign.subtitle}</p> : null}
          </div>

          <aside className="rounded-2xl border border-black/5 bg-[#111827] p-6 text-white shadow-sm">
            <Badge className="bg-[#FFD200] text-[#111827]">โครงการเผยแพร่แล้ว</Badge>
            <p className="mt-5 text-sm leading-6 text-white/70">{campaign.call_to_action_text || "เริ่มคำขอไกล่เกลี่ยโดยเชื่อมข้อมูลกับโครงการนี้โดยอัตโนมัติ"}</p>
            <Button href={`/campaigns/${campaign.id}/apply`} className="mt-6 h-12 w-full rounded-lg font-semibold">
              {campaign.button_text}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </aside>
        </div>
      </section>

      {campaign.campaign_image_url ? (
        <div className="mx-auto max-w-7xl px-5 pt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={campaign.campaign_image_url} alt="" className="max-h-96 w-full rounded-2xl object-cover shadow-sm" />
        </div>
      ) : null}

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-[1fr_24rem]">
        <article className="space-y-6">
          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">รายละเอียดโครงการ</h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#374151]">{campaign.description}</p>
          </div>

          <InfoList title="สิทธิประโยชน์" items={benefits} icon={CheckCircle2} />
          <InfoList title="เงื่อนไขเข้าร่วม" items={conditions} icon={FileText} />
          <InfoList title="เอกสารที่ควรเตรียม" items={requiredDocuments} icon={FileText} />

          <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">คำถามที่พบบ่อย</h2>
            <div className="mt-4 space-y-3">
              {faqs.length === 0 ? (
                <p className="text-sm text-[#6B7280]">ยังไม่มีคำถามที่พบบ่อยสำหรับโครงการนี้</p>
              ) : (
                faqs.map((faq, index) => (
                  <div key={index} className="rounded-lg bg-[#F8FAFC] p-4 text-sm">
                    {typeof faq === "string" ? faq : JSON.stringify(faq)}
                  </div>
                ))
              )}
            </div>
          </div>
        </article>

        <aside className="h-fit rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">ข้อมูลเจ้าหนี้</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="text-[#6B7280]">องค์กร</dt><dd className="font-medium">{organization?.organization_name}</dd></div>
            <div><dt className="text-[#6B7280]">ประเภท</dt><dd className="font-medium">{organization?.organization_type}</dd></div>
            {organization?.website ? (
              <div><dt className="text-[#6B7280]">เว็บไซต์</dt><dd><a href={organization.website} className="font-medium text-[#8A6500]">{organization.website}</a></dd></div>
            ) : null}
          </dl>
        </aside>
      </section>
    </main>
  );
}

function InfoList({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof CheckCircle2 }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-[#6B7280]">ไม่ระบุ</p>
        ) : items.map((item) => (
          <p key={item} className="flex gap-2 text-sm leading-6 text-[#374151]">
            <Icon className="mt-1 h-4 w-4 shrink-0 text-[#A87900]" aria-hidden="true" />
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}
