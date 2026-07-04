import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

export type TrustScore = Database["public"]["Tables"]["mediator_trust_scores"]["Row"];
export type TrustBadgeCode = TrustScore["badge_code"];
export type TopTrustedMediator = Database["public"]["Tables"]["mediator_profiles"]["Row"] & {
  mediator_trust_scores?: TrustScore[] | null;
};

export const trustBadgeLabels: Record<TrustBadgeCode, { en: string; th: string }> = {
  gold_elite: { en: "Gold Elite Mediator", th: "ผู้ไกล่เกลี่ยระดับ Gold Elite" },
  platinum: { en: "Platinum Mediator", th: "ผู้ไกล่เกลี่ยระดับ Platinum" },
  trusted: { en: "Trusted Mediator", th: "ผู้ไกล่เกลี่ยที่น่าเชื่อถือ" },
  verified: { en: "Verified Mediator", th: "ผู้ไกล่เกลี่ยที่ยืนยันแล้ว" },
  new_mediator: { en: "New Mediator", th: "ผู้ไกล่เกลี่ยใหม่" },
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function jsonList(value: Json | null | undefined) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function calculateTrustBadge(score: number): TrustBadgeCode {
  if (score >= 95) return "gold_elite";
  if (score >= 90) return "platinum";
  if (score >= 80) return "trusted";
  if (score >= 70) return "verified";
  return "new_mediator";
}

function responsivenessScore(averageHours: number | null) {
  if (averageHours === null) return 0;
  if (averageHours <= 4) return 100;
  if (averageHours <= 24) return 80;
  if (averageHours <= 48) return 60;
  if (averageHours <= 72) return 40;
  return 20;
}

export async function recalculateMediatorTrustScore(mediatorId: string) {
  const supabase = createAdminClient();
  const { data: profile } = await supabase.from("mediator_profiles").select("*").eq("id", mediatorId).maybeSingle();
  if (!profile) return null;

  const [{ data: certifications }, { data: documents }, { data: appointments }] = await Promise.all([
    supabase.from("mediator_certifications").select("*").eq("mediator_profile_id", mediatorId),
    supabase.from("mediator_documents").select("*").eq("mediator_profile_id", mediatorId),
    supabase.from("mediation_appointments").select("status, created_at, confirmed_by_mediator_at").eq("mediator_id", mediatorId),
  ]);

  const completedCases = profile.total_cases_handled;
  const successfulCases = profile.successful_cases;
  const ratingScore = 0;
  const reviewCount = 0;
  const averageRating = 0;
  const successRateScore = completedCases > 0 ? successfulCases / completedCases * 100 : 0;
  const yearsScore = Math.min(profile.mediation_experience_years / 10, 1) * 50;
  const casesScore = Math.min(completedCases / 100, 1) * 50;
  const experienceScore = yearsScore + casesScore;

  const responseSamples = (appointments ?? [])
    .filter((appointment) => appointment.confirmed_by_mediator_at)
    .map((appointment) => {
      const started = new Date(appointment.created_at).getTime();
      const confirmed = new Date(appointment.confirmed_by_mediator_at as string).getTime();
      return Math.max(0, (confirmed - started) / 36e5);
    });
  const averageResponseHours = responseSamples.length > 0
    ? responseSamples.reduce((sum, item) => sum + item, 0) / responseSamples.length
    : null;
  const responseScore = responsivenessScore(averageResponseHours);

  const tracked = (appointments ?? []).filter((appointment) => ["completed", "cancelled", "no_show"].includes(appointment.status));
  const reliabilityScore = tracked.length > 0
    ? tracked.reduce((sum, appointment) => sum + (appointment.status === "completed" ? 1 : appointment.status === "cancelled" ? 0.4 : 0), 0) / tracked.length * 100
    : 0;

  const certNames = [
    ...(certifications ?? []).map((item) => item.certification_name),
    ...(documents ?? []).map((item) => `${item.document_type} ${item.file_name ?? ""} ${item.file_url}`),
    ...jsonList(profile.expertise_areas),
  ].join(" ").toLowerCase();
  const qualificationScore = Math.min(100,
    (certifications && certifications.length > 0 ? 35 : 0)
    + (/training|อบรม|advanced/.test(certNames) ? 25 : 0)
    + (/member|membership|สมาคม|สมาชิก/.test(certNames) ? 20 : 0)
    + (profile.mediator_registration_authority ? 20 : 0),
  );

  const overallScore = clampScore(
    ratingScore * 0.30
    + successRateScore * 0.25
    + experienceScore * 0.15
    + responseScore * 0.10
    + reliabilityScore * 0.10
    + qualificationScore * 0.10,
  );

  const payload = {
    mediator_id: mediatorId,
    overall_score: overallScore,
    rating_score: clampScore(ratingScore),
    success_rate_score: clampScore(successRateScore),
    experience_score: clampScore(experienceScore),
    response_score: clampScore(responseScore),
    reliability_score: clampScore(reliabilityScore),
    qualification_score: clampScore(qualificationScore),
    review_count: reviewCount,
    average_rating: averageRating,
    completed_cases: completedCases,
    successful_cases: successfulCases,
    badge_code: calculateTrustBadge(overallScore),
    calculated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("mediator_trust_scores").upsert(payload, { onConflict: "mediator_id" }).select("*").single();
  if (error) {
    console.error("Trust score upsert failed", error);
    return null;
  }
  return data;
}

export async function recalculateAllMediatorTrustScores() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("mediator_profiles").select("id").eq("status", "approved");
  const results = [];
  for (const mediator of data ?? []) {
    results.push(await recalculateMediatorTrustScore(mediator.id));
  }
  return results.filter(Boolean);
}

export async function getMediatorTrustScore(mediatorId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("mediator_trust_scores").select("*").eq("mediator_id", mediatorId).maybeSingle();
  return data;
}

export async function getTopTrustedMediators(limit = 6) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mediator_profiles")
    .select("*, mediator_trust_scores(*)")
    .eq("status", "approved")
    .order("mediation_experience_years", { ascending: false });
  if (error) return [];
  const rows = (data ?? []) as unknown as TopTrustedMediator[];
  return rows
    .filter((mediator) => mediator.mediator_trust_scores?.[0])
    .sort((a, b) => {
      const aScore = a.mediator_trust_scores?.[0];
      const bScore = b.mediator_trust_scores?.[0];
      return (bScore?.overall_score ?? 0) - (aScore?.overall_score ?? 0)
        || (bScore?.review_count ?? 0) - (aScore?.review_count ?? 0)
        || b.mediation_experience_years - a.mediation_experience_years
        || new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
    .slice(0, limit);
}
