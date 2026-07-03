import "server-only";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json, MediatorProfileStatus } from "@/types/database";

export type MediatorProfile = Database["public"]["Tables"]["mediator_profiles"]["Row"];
export type MediatorAvailability = Database["public"]["Tables"]["mediator_availability"]["Row"];

export const mediatorStatusLabels: Record<MediatorProfileStatus, string> = {
  draft: "แบบร่าง",
  submitted: "ส่งตรวจสอบแล้ว",
  under_review: "อยู่ระหว่างตรวจสอบ",
  needs_revision: "ต้องแก้ไขข้อมูล",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
  suspended: "ระงับการแสดงผล",
};

export function jsonList(value: Json | null | undefined): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

export function linesToList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function numberValue(value: FormDataEntryValue | null) {
  const parsed = Number(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parseMediatorProfileForm(formData: FormData, userId: string) {
  const [firstNameFallback, ...lastNameParts] = String(formData.get("full_name") ?? "").trim().split(" ");

  return {
    user_id: userId,
    title: String(formData.get("title") ?? "").trim() || null,
    first_name: String(formData.get("first_name") ?? "").trim() || firstNameFallback || "",
    last_name: String(formData.get("last_name") ?? "").trim() || lastNameParts.join(" ") || "",
    profile_photo_url: String(formData.get("profile_photo_url") ?? "").trim() || null,
    citizen_id: String(formData.get("citizen_id") ?? "").trim() || null,
    date_of_birth: String(formData.get("date_of_birth") ?? "").trim() || null,
    gender: String(formData.get("gender") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    province: String(formData.get("province") ?? "").trim() || null,
    district: String(formData.get("district") ?? "").trim() || null,
    education_level: String(formData.get("education_level") ?? "").trim() || null,
    education_detail: String(formData.get("education_detail") ?? "").trim() || null,
    occupation: String(formData.get("occupation") ?? "").trim() || null,
    current_organization: String(formData.get("current_organization") ?? "").trim() || null,
    mediator_license_number: String(formData.get("mediator_license_number") ?? "").trim() || null,
    mediator_registration_authority: String(formData.get("mediator_registration_authority") ?? "").trim() || null,
    mediation_experience_years: numberValue(formData.get("mediation_experience_years")),
    total_cases_handled: numberValue(formData.get("total_cases_handled")),
    successful_cases: numberValue(formData.get("successful_cases")),
    expertise_areas: linesToList(formData.get("expertise_areas")),
    debt_types_supported: linesToList(formData.get("debt_types_supported")),
    languages: linesToList(formData.get("languages")),
    service_provinces: linesToList(formData.get("service_provinces")),
    online_mediation_available: formData.get("online_mediation_available") === "on",
    onsite_mediation_available: formData.get("onsite_mediation_available") === "on",
    profile_summary: String(formData.get("profile_summary") ?? "").trim() || null,
  };
}

export function parseAvailabilityForm(formData: FormData) {
  return {
    available_days: linesToList(formData.get("available_days")),
    available_time_slots: linesToList(formData.get("available_time_slots")),
    max_cases_per_month: numberValue(formData.get("max_cases_per_month")) || 10,
    active: formData.get("availability_active") !== "off",
  };
}

export async function getMediatorProfileByUser(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("mediator_profiles").select("*").eq("user_id", userId).maybeSingle();
  return data;
}

export async function getMediatorProfile(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("mediator_profiles").select("*").eq("id", profileId).maybeSingle();
  if (!data) notFound();
  return data;
}

export async function getMediatorAvailability(profileId?: string | null) {
  if (!profileId) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("mediator_availability").select("*").eq("mediator_profile_id", profileId).maybeSingle();
  return data;
}

export async function getMediatorDocuments(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("mediator_documents").select("*").eq("mediator_profile_id", profileId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getMediatorReviewLogs(profileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("mediator_review_logs").select("*").eq("mediator_profile_id", profileId).order("created_at", { ascending: false });
  return data ?? [];
}

export async function getSubmittedMediatorProfiles() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediator_profiles")
    .select("*")
    .in("status", ["submitted", "under_review", "needs_revision", "approved", "rejected", "suspended"])
    .order("updated_at", { ascending: false });
  return data ?? [];
}

export async function getApprovedMediatorsForCase(province?: string | null, debtType?: string | null) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediator_profiles")
    .select("*, mediator_availability(*)")
    .eq("status", "approved")
    .order("mediation_experience_years", { ascending: false });

  const rows = (data ?? []) as unknown as Array<MediatorProfile & { mediator_availability: MediatorAvailability[] | null }>;

  return rows.filter((profile) => {
    const availability = profile.mediator_availability?.[0];
    if (availability && !availability.active) return false;
    const provinces = jsonList(profile.service_provinces);
    const debtTypes = jsonList(profile.debt_types_supported);
    const provinceMatch = !province || profile.online_mediation_available || provinces.length === 0 || provinces.includes(province);
    const debtMatch = !debtType || debtTypes.length === 0 || debtTypes.some((item) => debtType.includes(item) || item.includes(debtType));
    return provinceMatch && debtMatch;
  });
}
