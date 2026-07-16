"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { generateMeetingMinutes } from "@/lib/meetings/processing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

async function requireStaff(appointmentId: string) {
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "mediator"].includes(profile.role)) redirect("/login");
  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("can_staff_appointment", { target_appointment_id: appointmentId });
  if (!allowed) redirect("/");
  return profile;
}

function lines(value: FormDataEntryValue | null) {
  return String(value ?? "").split(/\r?\n/).map((text) => text.trim()).filter(Boolean).map((text) => ({ text, segment_ids: [] })) as Json;
}

export async function saveManualTranscript(formData: FormData) {
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const content = String(formData.get("transcript") ?? "").trim();
  const profile = await requireStaff(appointmentId);
  if (!content || content.length > 250_000) redirect(`/staff/appointments/${appointmentId}/minutes?error=${encodeURIComponent("Transcript ต้องมีความยาวไม่เกิน 250,000 ตัวอักษร")}`);
  const admin = createAdminClient();
  const { data: artifact } = await admin.from("meeting_artifacts").insert({ appointment_id: appointmentId, artifact_type: "manual_transcript", external_name: `manual-${crypto.randomUUID()}`, status: "processed", processed_at: new Date().toISOString(), metadata: { entered_by: profile.id } }).select("id").single();
  const { data: transcript } = await admin.from("meeting_transcripts").insert({ appointment_id: appointmentId, artifact_id: artifact?.id ?? null, status: "ready", source: "manual", raw_text: content }).select("id").single();
  if (!transcript) throw new Error("Could not save transcript");
  const segments = content.split(/\r?\n/).map((text) => text.trim()).filter(Boolean).map((text, sequence) => {
    const match = text.match(/^(ผู้พูด\s*\d+)\s*:\s*(.*)$/);
    return { transcript_id: transcript.id, sequence, start_offset_ms: 0, end_offset_ms: 0, speaker_label: match?.[1] || "ผู้พูด 1", text: match?.[2] || text };
  });
  if (segments.length) await admin.from("meeting_transcript_segments").insert(segments);
  await admin.from("audit_logs").insert({ actor_profile_id: profile.id, action: "meeting_transcript.manual_created", entity_table: "meeting_transcripts", entity_id: transcript.id });
  redirect(`/staff/appointments/${appointmentId}/minutes?success=${encodeURIComponent("บันทึก transcript แบบ manual แล้ว")}`);
}

export async function generateMinutesDraft(formData: FormData) {
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const profile = await requireStaff(appointmentId);
  try {
    await generateMeetingMinutes(appointmentId, profile.id);
  } catch (error) {
    redirect(`/staff/appointments/${appointmentId}/minutes?error=${encodeURIComponent(error instanceof Error ? error.message : "สร้างร่างไม่สำเร็จ")}`);
  }
  revalidatePath(`/staff/appointments/${appointmentId}/minutes`);
}

export async function saveMinutesRevision(formData: FormData) {
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const profile = await requireStaff(appointmentId);
  const admin = createAdminClient();
  const { data: minutes } = await admin.from("meeting_minutes").select("*").eq("appointment_id", appointmentId).single();
  if (!minutes) redirect(`/staff/appointments/${appointmentId}/minutes?error=${encodeURIComponent("ยังไม่มีร่างบันทึกการประชุม")}`);
  const { data: current } = await admin.from("meeting_minute_versions").select("*").eq("minutes_id", minutes.id).eq("version", minutes.current_version).single();
  if (!current) throw new Error("Current version not found");
  const version = minutes.current_version + 1;
  await admin.from("meeting_minute_versions").insert({ minutes_id: minutes.id, version, meeting_datetime: current.meeting_datetime, verified_attendees: current.verified_attendees, objective: String(formData.get("objective") ?? "").trim(), key_points: lines(formData.get("key_points")), party_positions: lines(formData.get("party_positions")), monetary_proposals: lines(formData.get("monetary_proposals")), confirmed_agreements: lines(formData.get("confirmed_agreements")), unresolved_issues: lines(formData.get("unresolved_issues")), action_items: lines(formData.get("action_items")), next_steps: lines(formData.get("next_steps")), low_confidence_items: current.low_confidence_items, source_segment_ids: current.source_segment_ids, status: "draft", created_by: profile.id });
  await admin.from("meeting_minutes").update({ current_version: version }).eq("id", minutes.id);
  await admin.from("audit_logs").insert({ actor_profile_id: profile.id, action: "meeting_minutes.edited", entity_table: "meeting_minutes", entity_id: minutes.id, metadata: { version } });
  revalidatePath(`/staff/appointments/${appointmentId}/minutes`);
}

export async function approveMinutes(formData: FormData) {
  const appointmentId = String(formData.get("appointment_id") ?? "");
  const profile = await requireStaff(appointmentId);
  const admin = createAdminClient();
  const { data: minutes } = await admin.from("meeting_minutes").select("*").eq("appointment_id", appointmentId).single();
  if (!minutes || minutes.current_version < 1) throw new Error("Minutes draft not found");
  const now = new Date().toISOString();
  await admin.from("meeting_minute_versions").update({ status: "superseded" }).eq("minutes_id", minutes.id).eq("status", "approved");
  await admin.from("meeting_minute_versions").update({ status: "approved", approved_by: profile.id, approved_at: now }).eq("minutes_id", minutes.id).eq("version", minutes.current_version);
  await admin.from("meeting_minutes").update({ status: "approved", approved_by: profile.id, approved_at: now }).eq("id", minutes.id);
  await admin.from("audit_logs").insert({ actor_profile_id: profile.id, action: "meeting_minutes.approved", entity_table: "meeting_minutes", entity_id: minutes.id, metadata: { version: minutes.current_version } });
  revalidatePath("/", "layout");
}
