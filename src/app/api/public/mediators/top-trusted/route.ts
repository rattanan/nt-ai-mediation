import { NextResponse } from "next/server";
import { getTopTrustedMediators, trustBadgeLabels } from "@/lib/trust-score";

export const dynamic = "force-dynamic";

export async function GET() {
  const mediators = await getTopTrustedMediators(6);
  return NextResponse.json({
    data: mediators.map((mediator) => {
      const score = mediator.mediator_trust_scores?.[0];
      return {
        id: mediator.id,
        name: `${mediator.title ?? ""} ${mediator.first_name} ${mediator.last_name}`.trim(),
        province: mediator.province,
        photoUrl: mediator.profile_photo_url,
        yearsExperience: mediator.mediation_experience_years,
        completedCases: mediator.total_cases_handled,
        successfulCases: mediator.successful_cases,
        onlineAvailable: mediator.online_mediation_available,
        trustScore: score?.overall_score ?? 0,
        badge: score ? trustBadgeLabels[score.badge_code] : trustBadgeLabels.new_mediator,
        averageRating: score?.average_rating ?? 0,
        reviewCount: score?.review_count ?? 0,
      };
    }),
  });
}
