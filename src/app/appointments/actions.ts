"use server";

import { revalidatePath } from "next/cache";
import { configureMeetAutoRecording } from "@/lib/google/workspace-meet";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function recordAppointmentRecordingConsent(formData: FormData) {
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const decision = String(formData.get("consented") ?? "") === "true";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !appointmentId) throw new Error("Unauthorized");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["debtor", "creditor", "mediator"].includes(profile.role)) throw new Error("Forbidden");
  const { data: appointment } = await supabase.from("mediation_appointments").select("id").eq("id", appointmentId).maybeSingle();
  if (!appointment) throw new Error("Forbidden");
  const role: "debtor" | "creditor" | "mediator" = profile.role === "debtor" ? "debtor" : profile.role === "creditor" ? "creditor" : "mediator";
  const consentVersion = process.env.MEETING_RECORDING_CONSENT_VERSION || "2026-07-13";
  const { error } = await supabase.from("appointment_recording_consents").upsert({ appointment_id: appointmentId, participant_profile_id: user.id, participant_role: role, consented: decision, consent_version: consentVersion, consented_at: new Date().toISOString(), revoked_at: decision ? null : new Date().toISOString() }, { onConflict: "appointment_id,participant_profile_id,consent_version" });
  if (error) throw new Error("Could not record consent");
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({ actor_profile_id: user.id, action: decision ? "meeting_recording.consent_granted" : "meeting_recording.consent_declined", entity_table: "mediation_appointments", entity_id: appointmentId, metadata: { consent_version: consentVersion, participant_role: role } });
  await configureMeetAutoRecording(appointmentId).catch((configureError) => console.error("Auto recording configuration failed", configureError));
  revalidatePath("/", "layout");
}
