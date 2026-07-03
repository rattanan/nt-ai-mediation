import { redirect } from "next/navigation";
import { createCase } from "@/app/debtor/cases/actions";
import { CaseForm } from "@/components/debtor/case-form";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { getRoleHome } from "@/lib/auth/routes";
import { getCurrentProfile } from "@/lib/auth/server";
import { getPublishedCampaign } from "@/lib/campaigns";

export const dynamic = "force-dynamic";

export default async function CampaignApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getPublishedCampaign(id);
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect(`/login?returnUrl=${encodeURIComponent(`/campaigns/${id}/apply`)}&message=${encodeURIComponent("กรุณาเข้าสู่ระบบหรือสมัครสมาชิกก่อนเริ่มคำขอ")}`);
  }

  if (profile.role !== "debtor") {
    redirect(getRoleHome(profile.role));
  }

  return (
    <DebtorShell
      profile={profile}
      activePath="/debtor"
      title="เริ่มคำขอจากโครงการเจ้าหนี้"
      subtitle="กรอกข้อมูลเพื่อสร้างคำขอไกล่เกลี่ยที่เชื่อมกับโครงการนี้"
    >
      <CaseForm
        action={createCase}
        submitLabel="บันทึกแบบร่างคำขอ"
        campaignSummary={{
          organizationId: campaign.organization_id,
          campaignId: campaign.id,
          organizationName: campaign.creditor_organizations?.organization_name ?? "เจ้าหนี้",
          campaignTitle: campaign.title,
          campaignDescription: campaign.subtitle || campaign.description,
          debtType: campaign.target_debt_type,
        }}
      />
    </DebtorShell>
  );
}
