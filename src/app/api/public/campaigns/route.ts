import { NextResponse } from "next/server";
import { getPublishedCampaigns, jsonList } from "@/lib/campaigns";

export async function GET() {
  const campaigns = await getPublishedCampaigns(24);

  return NextResponse.json({
    campaigns: campaigns.map((campaign) => ({
      id: campaign.id,
      organizationId: campaign.organization_id,
      organizationName: campaign.creditor_organizations?.organization_name ?? "",
      organizationLogoUrl: campaign.creditor_organizations?.logo_url ?? campaign.creditor_organizations?.logo ?? null,
      title: campaign.title,
      subtitle: campaign.subtitle,
      description: campaign.description,
      benefits: jsonList(campaign.benefits),
      conditions: jsonList(campaign.conditions),
      targetDebtType: campaign.target_debt_type,
      targetProvince: campaign.target_province,
      buttonText: campaign.button_text,
      isFeatured: campaign.is_featured,
    })),
  });
}
