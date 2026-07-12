"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { getRoleHome } from "@/lib/auth/routes";
import { createAdminClient } from "@/lib/supabase/admin";

const PREFERRED_MEDIATOR_COOKIE = "nt_preferred_mediator";

export async function choosePublicMediator(formData: FormData) {
  const mediatorId = String(formData.get("mediator_id") ?? "");
  const supabase = createAdminClient();
  const { data: mediator } = await supabase.from("mediator_profiles").select("id").eq("id", mediatorId).eq("status", "approved").maybeSingle();
  if (!mediator) redirect(`/mediators?error=${encodeURIComponent("ผู้ไกล่เกลี่ยนี้ยังไม่พร้อมรับเลือก")}`);

  const cookieStore = await cookies();
  cookieStore.set(PREFERRED_MEDIATOR_COOKIE, mediator.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  const profile = await getCurrentProfile();
  const destination = `/debtor/cases/new?mediator=${encodeURIComponent(mediator.id)}`;
  if (!profile) redirect(`/login?returnUrl=${encodeURIComponent(destination)}`);
  if (profile.role !== "debtor") redirect(getRoleHome(profile.role));
  redirect(destination);
}
