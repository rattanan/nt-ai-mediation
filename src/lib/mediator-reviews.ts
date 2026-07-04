import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type MediatorReview = Database["public"]["Tables"]["mediator_reviews"]["Row"];
export type MediatorReviewWithDetails = MediatorReview & {
  cases?: Pick<Database["public"]["Tables"]["cases"]["Row"], "case_number" | "creditor_name"> | null;
  mediator_profiles?: Pick<Database["public"]["Tables"]["mediator_profiles"]["Row"], "first_name" | "last_name" | "title"> | null;
  debtor_profile?: Pick<Database["public"]["Tables"]["profiles"]["Row"], "full_name" | "email"> | null;
};

export async function getMediatorReviewForCase(caseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediator_reviews")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();
  return data;
}

export async function listPendingMediatorReviews() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediator_reviews")
    .select("*, cases(case_number, creditor_name), mediator_profiles(title, first_name, last_name), debtor_profile:profiles!mediator_reviews_debtor_user_id_fkey(full_name, email)")
    .eq("status", "pending")
    .order("submitted_at", { ascending: true });
  return (data ?? []) as unknown as MediatorReviewWithDetails[];
}
