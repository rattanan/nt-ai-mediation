import { NextResponse } from "next/server";
import { getPublishedCampaign, jsonList } from "@/lib/campaigns";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getPublishedCampaign(id);

  return NextResponse.json({
    id: campaign.id,
    organizationId: campaign.organization_id,
    organization: campaign.creditor_organizations,
    title: campaign.title,
    subtitle: campaign.subtitle,
    description: campaign.description,
    campaignImageUrl: campaign.campaign_image_url,
    benefits: jsonList(campaign.benefits),
    conditions: jsonList(campaign.conditions),
    requiredDocuments: jsonList(campaign.required_documents),
    targetDebtType: campaign.target_debt_type,
    targetProvince: campaign.target_province,
    buttonText: campaign.button_text,
  });
}
