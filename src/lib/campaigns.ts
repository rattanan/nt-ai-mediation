import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CreditorCampaignStatus, Database, Json } from "@/types/database";

export type CreditorCampaign = Database["public"]["Tables"]["creditor_campaigns"]["Row"];
export type CampaignOrganization = Database["public"]["Tables"]["creditor_organizations"]["Row"];
export type PublicCampaign = CreditorCampaign & {
  creditor_organizations: CampaignOrganization | null;
};

export const campaignStatusLabels: Record<CreditorCampaignStatus, string> = {
  draft: "แบบร่าง",
  pending_review: "รอผู้ดูแลตรวจสอบ",
  published: "เผยแพร่แล้ว",
  expired: "หมดอายุ",
};

export function jsonList(value: Json | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

export function linesToJsonList(value: FormDataEntryValue | null): string[] {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function getPublishedCampaigns(limit = 12) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_campaigns")
    .select("*, creditor_organizations(*)")
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("updated_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as unknown as PublicCampaign[];
}

export async function getPublishedCampaign(campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_campaigns")
    .select("*, creditor_organizations(*)")
    .eq("id", campaignId)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return data as unknown as PublicCampaign;
}

export async function getAnyCampaign(campaignId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_campaigns")
    .select("*, creditor_organizations(*)")
    .eq("id", campaignId)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return data as unknown as PublicCampaign;
}

export async function getCreditorCampaigns(organizationId?: string | null) {
  if (!organizationId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_campaigns")
    .select("*")
    .eq("organization_id", organizationId)
    .order("updated_at", { ascending: false });

  return (data ?? []) as CreditorCampaign[];
}

export async function getAdminCampaigns() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_campaigns")
    .select("*, creditor_organizations(*)")
    .order("status", { ascending: true })
    .order("updated_at", { ascending: false });

  return (data ?? []) as unknown as PublicCampaign[];
}
