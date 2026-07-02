import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";
import { getRoleHome } from "./routes";

export type AuthProfile = {
  id: string;
  role: AppRole;
  full_name: string;
};

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile as AuthProfile;
}

export async function requireRole(expectedRole: AppRole): Promise<AuthProfile> {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== expectedRole) {
    redirect(getRoleHome(profile.role));
  }

  return profile;
}
