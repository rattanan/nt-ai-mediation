import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AppRole, Database, Json } from "@/types/database";
import { isAppRole } from "@/lib/auth/routes";

export const appBaseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXTAUTH_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://127.0.0.1:3000");
export const emailVerificationRedirectUrl = `${appBaseUrl}/auth/callback`;

export type AccountStatus = "pending_verification" | "active" | "suspended" | "disabled";

export function appUrl(path: string) {
  return new URL(path, appBaseUrl);
}

export function isEmailVerified(user: User) {
  const provider = user.app_metadata?.provider;
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers
    : [];
  const isGoogleUser = provider === "google" || providers.includes("google");

  return Boolean(user.email_confirmed_at) || (isGoogleUser && Boolean(user.email));
}

export function getRoleFromUserMetadata(user: User): AppRole {
  const role = user.user_metadata?.role;
  return typeof role === "string" && isAppRole(role) ? role : "debtor";
}

export function getFullNameFromUser(user: User) {
  if (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) {
    return user.user_metadata.full_name.trim();
  }

  if (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()) {
    return user.user_metadata.name.trim();
  }

  return user.email ?? "ผู้ใช้งาน";
}

export function getOrganizationNameFromUser(user: User) {
  return typeof user.user_metadata?.organization_name === "string"
    ? user.user_metadata.organization_name.trim() || null
    : null;
}

export async function writeAuditLog(
  supabase: SupabaseClient<Database>,
  action: "EMAIL_VERIFICATION_SENT" | "EMAIL_VERIFICATION_COMPLETED" | "EMAIL_VERIFICATION_RESENT",
  metadata: Json = {},
  actorProfileId?: string | null,
) {
  const { error } = await supabase.from("audit_logs").insert({
    action,
    entity_table: "auth.users",
    entity_id: actorProfileId ?? null,
    actor_profile_id: actorProfileId ?? null,
    metadata,
  });

  if (error) {
    console.error("Audit log insert failed", { action, message: error.message });
  }
}
