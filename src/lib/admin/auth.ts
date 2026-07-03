import "server-only";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";

export async function requireAdmin() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect(profile.role === "debtor" ? "/debtor" : profile.role === "mediator" ? "/mediator" : "/creditor");
  }

  return profile;
}
