import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CreditorOrganizationStatus, Database } from "@/types/database";

export type CreditorOrganization = Database["public"]["Tables"]["creditor_organizations"]["Row"];
export type CreditorOfficer = Database["public"]["Tables"]["creditor_officers"]["Row"];
export type CreditorCase = Database["public"]["Tables"]["cases"]["Row"];

export const creditorOrganizationStatusLabels: Record<CreditorOrganizationStatus, string> = {
  pending: "รออนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ปฏิเสธ",
  suspended: "ระงับใช้งาน",
};

export async function getCreditorOfficer(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_officers")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data;
}

export async function getCreditorOrganization(organizationId?: string | null) {
  if (!organizationId) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_organizations")
    .select("*")
    .eq("id", organizationId)
    .maybeSingle();
  return data;
}

export async function getCreditorCases(organizationId?: string | null) {
  if (!organizationId) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("creditor_organization_id", organizationId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getCreditorCase(caseId: string, organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("creditor_organization_id", organizationId)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  return data;
}

export async function getCreditorResponses(caseId: string, organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("case_creditor_responses")
    .select("*")
    .eq("case_id", caseId)
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export async function listCreditorOrganizations() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_organizations")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function listCreditorOfficers(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creditor_officers")
    .select("*")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  return data ?? [];
}
