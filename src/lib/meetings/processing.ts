import "server-only";

import { requestStructuredAi, stringArray } from "@/lib/ai/client";
import { getGoogleAccessToken } from "@/lib/google/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createGoogleMeetForAppointment } from "@/lib/google/workspace-meet";
import type { Json } from "@/types/database";

const meetReadonly = "https://www.googleapis.com/auth/meetings.space.readonly";
const driveMeetReadonly = "https://www.googleapis.com/auth/drive.meet.readonly";
const cloudPlatform = "https://www.googleapis.com/auth/cloud-platform";

function delegatedOrganizer() {
  const value =
    process.env.GOOGLE_CALENDAR_ORGANIZER_EMAIL ||
    process.env.GOOGLE_WORKSPACE_ORGANIZER_EMAIL;
  if (!value) throw new Error("Google Calendar organizer is not configured");
  return value;
}

async function authorizedJson<T>(url: string, scopes: string[], subject?: string, init?: RequestInit) {
  const token = await getGoogleAccessToken(scopes, subject);
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers }, cache: "no-store" });
  if (!response.ok) throw new Error(`Google API returned ${response.status}: ${(await response.text()).slice(0, 240)}`);
  return await response.json() as T;
}

function milliseconds(offset: string | undefined) {
  if (!offset) return 0;
  const match = offset.match(/^([\d.]+)s$/);
  return match ? Math.round(Number(match[1]) * 1000) : 0;
}

type CitedItem = { text: string; segment_ids: string[] };

function citedItems(value: unknown, validSegmentIds: Set<string>) {
  const items: CitedItem[] = [];
  const uncited: CitedItem[] = [];
  for (const candidate of Array.isArray(value) ? value : []) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const object = candidate as Record<string, unknown>;
    const text = String(object.text ?? "").trim();
    if (!text) continue;
    const segmentIds = stringArray(object.segment_ids).filter((id) => validSegmentIds.has(id));
    const normalized = { text, segment_ids: segmentIds };
    if (segmentIds.length) items.push(normalized); else uncited.push(normalized);
  }
  return { items, uncited };
}

export async function queueMeetingProcessing(appointmentId: string) {
  const admin = createAdminClient();
  const { data: existing } = await admin.from("meeting_processing_jobs").select("id").eq("appointment_id", appointmentId).in("status", ["queued", "processing"]).limit(1);
  if (!existing?.length) await admin.from("meeting_processing_jobs").insert({ appointment_id: appointmentId, job_type: "artifact_poll" });
  await admin.from("mediation_appointments").update({ recording_status: "processing", artifact_poll_after: new Date().toISOString() }).eq("id", appointmentId);
}

async function discoverRecording(appointmentId: string) {
  const admin = createAdminClient();
  const { data: appointment } = await admin.from("mediation_appointments").select("meeting_code").eq("id", appointmentId).single();
  if (!appointment?.meeting_code) throw new Error("Appointment has no Google Meet code");
  const subject = delegatedOrganizer();
  const filter = encodeURIComponent(`space.meeting_code="${appointment.meeting_code}"`);
  const conferences = await authorizedJson<{ conferenceRecords?: Array<{ name: string }> }>(`https://meet.googleapis.com/v2/conferenceRecords?filter=${filter}`, [meetReadonly], subject);
  const record = conferences.conferenceRecords?.[0];
  if (!record) return null;
  const recordings = await authorizedJson<{ recordings?: Array<{ name: string; driveDestination?: { file?: string; exportUri?: string }; state?: string }> }>(`https://meet.googleapis.com/v2/${record.name}/recordings`, [meetReadonly], subject);
  const recording = recordings.recordings?.find((item) => item.state === "FILE_GENERATED" && item.driveDestination?.file);
  if (!recording?.driveDestination?.file) return null;
  const { data: artifact } = await admin.from("meeting_artifacts").upsert({ appointment_id: appointmentId, artifact_type: "recording", external_name: recording.name, drive_file_id: recording.driveDestination.file, source_uri: recording.driveDestination.exportUri ?? null, status: "discovered", metadata: { conference_record: record.name } }, { onConflict: "appointment_id,artifact_type,external_name" }).select("*").single();
  return artifact;
}

async function startTranscription(appointmentId: string, artifactId: string, driveFileId: string) {
  const admin = createAdminClient();
  const driveToken = await getGoogleAccessToken([driveMeetReadonly], delegatedOrganizer());
  const normalizedDriveFileId = driveFileId.replace(/^files\//, "");
  const driveResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(normalizedDriveFileId)}?alt=media`, { headers: { Authorization: `Bearer ${driveToken}` }, cache: "no-store" });
  if (!driveResponse.ok) throw new Error(`Drive recording download returned ${driveResponse.status}`);
  const recording = Buffer.from(await driveResponse.arrayBuffer());
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const bucket = process.env.GOOGLE_MEETING_TEMP_BUCKET;
  const location = process.env.GOOGLE_SPEECH_LOCATION || "asia-southeast1";
  const recognizer = process.env.GOOGLE_SPEECH_RECOGNIZER;
  if (!project || !bucket || !recognizer) throw new Error("Speech-to-Text storage/recognizer is not configured");
  const objectName = `meeting-recordings/${appointmentId}/${artifactId}.mp4`;
  const token = await getGoogleAccessToken([cloudPlatform]);
  const upload = await fetch(`https://storage.googleapis.com/upload/storage/v1/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(objectName)}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "video/mp4" }, body: recording });
  if (!upload.ok) throw new Error(`Temporary GCS upload returned ${upload.status}`);
  const speech = await authorizedJson<{ name: string }>(`https://${location}-speech.googleapis.com/v2/projects/${project}/locations/${location}/recognizers/${recognizer}:batchRecognize`, [cloudPlatform], undefined, { method: "POST", body: JSON.stringify({ config: { autoDecodingConfig: {}, languageCodes: ["th-TH"], model: "chirp_2", features: { enableAutomaticPunctuation: true, enableSpeakerDiarization: true, diarizationSpeakerCount: 3 } }, files: [{ uri: `gs://${bucket}/${objectName}` }], recognitionOutputConfig: { inlineResponseConfig: {} } }) });
  await admin.from("meeting_artifacts").update({ status: "copied", metadata: { gcs_object: objectName, speech_operation: speech.name } }).eq("id", artifactId);
  return { operationName: speech.name, objectName };
}

type SpeechResult = { resultEndOffset?: string; alternatives?: Array<{ transcript?: string; confidence?: number; words?: Array<{ speakerLabel?: string }> }> };

async function finishTranscription(appointmentId: string, artifactId: string, operationName: string, objectName: string) {
  const admin = createAdminClient();
  const location = process.env.GOOGLE_SPEECH_LOCATION || "asia-southeast1";
  const operation = await authorizedJson<{ done?: boolean; error?: { message?: string }; response?: { results?: Record<string, { transcript?: { results?: SpeechResult[] } }> } }>(`https://${location}-speech.googleapis.com/v2/${operationName}`, [cloudPlatform]);
  if (!operation.done) return false;
  if (operation.error) throw new Error(operation.error.message || "Speech transcription failed");
  const speechResults = Object.values(operation.response?.results ?? {}).flatMap((entry) => entry.transcript?.results ?? []);
  const retentionDays = Math.max(1, Number(process.env.MEETING_TRANSCRIPT_RETENTION_DAYS || 180));
  const retentionUntil = new Date(Date.now() + retentionDays * 86_400_000).toISOString();
  const rawText = speechResults.map((result) => result.alternatives?.[0]?.transcript?.trim()).filter(Boolean).join("\n");
  const confidences = speechResults.map((result) => result.alternatives?.[0]?.confidence).filter((value): value is number => typeof value === "number");
  const { data: transcript } = await admin.from("meeting_transcripts").insert({ appointment_id: appointmentId, artifact_id: artifactId, status: "ready", raw_text: rawText, private_storage_path: objectName, average_confidence: confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : null, retention_until: retentionUntil }).select("id").single();
  if (!transcript) throw new Error("Could not save transcript");
  let previousEnd = 0;
  const segments = speechResults.map((result, sequence) => {
    const alternative = result.alternatives?.[0];
    const end = milliseconds(result.resultEndOffset);
    const labels = alternative?.words?.map((word) => word.speakerLabel).filter(Boolean) ?? [];
    const label = labels[0] ? `ผู้พูด ${labels[0]}` : "ผู้พูด 1";
    const segment = { transcript_id: transcript.id, sequence, start_offset_ms: previousEnd, end_offset_ms: Math.max(end, previousEnd), speaker_label: label, text: alternative?.transcript?.trim() || "", confidence: alternative?.confidence ?? null };
    previousEnd = Math.max(end, previousEnd);
    return segment;
  }).filter((segment) => segment.text);
  if (segments.length) await admin.from("meeting_transcript_segments").insert(segments);
  await admin.from("meeting_artifacts").update({ status: "processed", processed_at: new Date().toISOString() }).eq("id", artifactId);
  await admin.from("mediation_appointments").update({ recording_status: "ready" }).eq("id", appointmentId);
  await admin.from("meeting_processing_jobs").insert({ appointment_id: appointmentId, job_type: "summarize" });
  return true;
}

export async function generateMeetingMinutes(appointmentId: string, actorId?: string | null) {
  const admin = createAdminClient();
  const { data: appointment } = await admin.from("mediation_appointments").select("case_id, appointment_date, start_time, end_time").eq("id", appointmentId).single();
  const { data: transcript } = await admin.from("meeting_transcripts").select("id").eq("appointment_id", appointmentId).eq("status", "ready").order("created_at", { ascending: false }).limit(1).single();
  if (!appointment || !transcript) throw new Error("Transcript is not ready");
  const { data: segments } = await admin.from("meeting_transcript_segments").select("id, sequence, speaker_label, text, confidence").eq("transcript_id", transcript.id).order("sequence");
  const source = (segments ?? []).map((segment) => `[${segment.id}] ${segment.speaker_label}: ${segment.text}`).join("\n");
  const { data } = await requestStructuredAi([
    { role: "system", content: "ร่างบันทึกการประชุมไกล่เกลี่ยภาษาไทยจาก transcript เท่านั้น ห้ามเดาชื่อผู้พูด ตัวเลขและข้อความสำคัญทุกข้อใส่ segment_ids ที่อ้างอิง ตอบ JSON keys: objective string, key_points array, party_positions array, monetary_proposals array, confirmed_agreements array, unresolved_issues array, action_items array, next_steps array, low_confidence_items array, source_segment_ids string[] แต่ละรายการใน array เป็น object {text,segment_ids}; ถ้าไม่แน่ใจให้อยู่ low_confidence_items" },
    { role: "user", content: source.slice(0, 100_000) },
  ]);
  const validSegmentIds = new Set((segments ?? []).map((segment) => segment.id));
  const fields = {
    key_points: citedItems(data.key_points, validSegmentIds),
    party_positions: citedItems(data.party_positions, validSegmentIds),
    monetary_proposals: citedItems(data.monetary_proposals, validSegmentIds),
    confirmed_agreements: citedItems(data.confirmed_agreements, validSegmentIds),
    unresolved_issues: citedItems(data.unresolved_issues, validSegmentIds),
    action_items: citedItems(data.action_items, validSegmentIds),
    next_steps: citedItems(data.next_steps, validSegmentIds),
  };
  const lowConfidence = citedItems(data.low_confidence_items, validSegmentIds).items.concat(Object.values(fields).flatMap((field) => field.uncited));
  const sourceSegmentIds = [...new Set(Object.values(fields).flatMap((field) => field.items.flatMap((item) => item.segment_ids)))];
  const { data: participants } = await admin.from("appointment_participants").select("profile_id, role").eq("appointment_id", appointmentId).not("profile_id", "is", null);
  const participantIds = (participants ?? []).map((participant) => participant.profile_id).filter((id): id is string => Boolean(id));
  const { data: participantProfiles } = participantIds.length ? await admin.from("profiles").select("id, full_name").in("id", participantIds) : { data: [] };
  const names = new Map((participantProfiles ?? []).map((profile) => [profile.id, profile.full_name]));
  const verifiedAttendees = (participants ?? []).filter((participant) => participant.profile_id && names.has(participant.profile_id)).map((participant) => ({ role: participant.role, profile_id: participant.profile_id, name: names.get(participant.profile_id!) }));
  let { data: minutes } = await admin.from("meeting_minutes").select("*").eq("appointment_id", appointmentId).maybeSingle();
  if (!minutes) {
    const created = await admin.from("meeting_minutes").insert({ appointment_id: appointmentId, case_id: appointment.case_id, status: "draft" }).select("*").single();
    minutes = created.data;
  }
  if (!minutes) throw new Error("Could not create meeting minutes");
  const version = minutes.current_version + 1;
  await admin.from("meeting_minute_versions").insert({ minutes_id: minutes.id, version, meeting_datetime: `${appointment.appointment_date} ${appointment.start_time}-${appointment.end_time}`, verified_attendees: verifiedAttendees as Json, objective: String(data.objective ?? ""), key_points: fields.key_points.items as Json, party_positions: fields.party_positions.items as Json, monetary_proposals: fields.monetary_proposals.items as Json, confirmed_agreements: fields.confirmed_agreements.items as Json, unresolved_issues: fields.unresolved_issues.items as Json, action_items: fields.action_items.items as Json, next_steps: fields.next_steps.items as Json, low_confidence_items: lowConfidence as Json, source_segment_ids: sourceSegmentIds as Json, status: "draft", created_by: actorId ?? null });
  await admin.from("meeting_minutes").update({ current_version: version }).eq("id", minutes.id);
  await admin.from("audit_logs").insert({ actor_profile_id: actorId ?? null, action: "meeting_minutes.ai_generated", entity_table: "meeting_minutes", entity_id: minutes.id, metadata: { version } });
}

export async function processNextMeetingJob() {
  const admin = createAdminClient();
  const { data: job } = await admin.from("meeting_processing_jobs").select("*").eq("status", "queued").lte("next_attempt_at", new Date().toISOString()).order("next_attempt_at").limit(1).maybeSingle();
  if (!job) return { processed: false };
  await admin.from("meeting_processing_jobs").update({ status: "processing", attempts: job.attempts + 1, started_at: new Date().toISOString() }).eq("id", job.id);
  try {
    if (job.job_type === "artifact_poll") {
      const artifact = await discoverRecording(job.appointment_id);
      if (!artifact?.drive_file_id) {
        const age = Date.now() - new Date(job.created_at).getTime();
        if (age >= 2 * 60 * 60 * 1000) throw new Error("Recording artifact was not available within 2 hours");
        const delayMinutes = Math.min(15, 2 ** Math.min(job.attempts, 4));
        await admin.from("meeting_processing_jobs").update({ status: "queued", next_attempt_at: new Date(Date.now() + delayMinutes * 60_000).toISOString(), last_error: "Recording not available yet" }).eq("id", job.id);
        return { processed: true, retry: true };
      }
      await admin.from("meeting_processing_jobs").update({ status: "completed", completed_at: new Date().toISOString(), result: { artifact_id: artifact.id } }).eq("id", job.id);
      await admin.from("meeting_processing_jobs").insert({ appointment_id: job.appointment_id, job_type: "transcribe", payload: { artifact_id: artifact.id, drive_file_id: artifact.drive_file_id } });
    } else if (job.job_type === "transcribe") {
      const payload = job.payload && typeof job.payload === "object" && !Array.isArray(job.payload) ? job.payload as Record<string, Json | undefined> : {};
      if (typeof payload.operation_name === "string" && typeof payload.object_name === "string" && typeof payload.artifact_id === "string") {
        const done = await finishTranscription(job.appointment_id, payload.artifact_id, payload.operation_name, payload.object_name);
        if (!done) {
          await admin.from("meeting_processing_jobs").update({ status: "queued", next_attempt_at: new Date(Date.now() + 60_000).toISOString() }).eq("id", job.id);
          return { processed: true, retry: true };
        }
        await admin.from("meeting_processing_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job.id);
      } else if (typeof payload.artifact_id === "string" && typeof payload.drive_file_id === "string") {
        const started = await startTranscription(job.appointment_id, payload.artifact_id, payload.drive_file_id);
        await admin.from("meeting_processing_jobs").update({ status: "queued", payload: { ...payload, operation_name: started.operationName, object_name: started.objectName }, next_attempt_at: new Date(Date.now() + 60_000).toISOString() }).eq("id", job.id);
      } else throw new Error("Transcription job payload is incomplete");
    } else if (job.job_type === "summarize") {
      await generateMeetingMinutes(job.appointment_id);
      await admin.from("meeting_processing_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job.id);
    }
    return { processed: true };
  } catch (error) {
    const attempts = job.attempts + 1;
    const terminal = attempts >= 3 || (Date.now() - new Date(job.created_at).getTime()) >= 2 * 60 * 60 * 1000;
    await admin.from("meeting_processing_jobs").update({ status: terminal ? "manual_required" : "queued", attempts, next_attempt_at: new Date(Date.now() + Math.min(15, 2 ** attempts) * 60_000).toISOString(), last_error: error instanceof Error ? error.message : "Meeting processing failed" }).eq("id", job.id);
    if (terminal) await admin.from("mediation_appointments").update({ recording_status: "failed" }).eq("id", job.appointment_id);
    return { processed: true, error: error instanceof Error ? error.message : "failed" };
  }
}

export async function reconcileMeetingProcessing() {
  const admin = createAdminClient();
  const { data: pendingMeetLinks } = await admin.from("mediation_appointments").select("id, meeting_created_by, debtor_user_id").eq("google_sync_status", "creating").not("calendar_event_id", "is", null).limit(50);
  for (const appointment of pendingMeetLinks ?? []) {
    await createGoogleMeetForAppointment(appointment.id, appointment.meeting_created_by || appointment.debtor_user_id).catch((error) => console.error("Pending Meet link reconciliation failed", error));
  }
  const { data: completed } = await admin.from("mediation_appointments").select("id").eq("status", "completed").in("recording_status", ["enabled", "processing"]).limit(50);
  for (const appointment of completed ?? []) await queueMeetingProcessing(appointment.id);

  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: artifacts } = await admin.from("meeting_artifacts").select("id, metadata").eq("status", "processed").lt("processed_at", cutoff).limit(50);
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const bucket = process.env.GOOGLE_MEETING_TEMP_BUCKET;
  if (project && bucket) {
    const token = await getGoogleAccessToken([cloudPlatform]);
    for (const artifact of artifacts ?? []) {
      const metadata = artifact.metadata && typeof artifact.metadata === "object" && !Array.isArray(artifact.metadata) ? artifact.metadata as Record<string, Json | undefined> : {};
      if (typeof metadata.gcs_object !== "string") continue;
      const response = await fetch(`https://storage.googleapis.com/storage/v1/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(metadata.gcs_object)}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (response.ok || response.status === 404) await admin.from("meeting_artifacts").update({ status: "deleted" }).eq("id", artifact.id);
    }
  }

  const now = new Date().toISOString();
  const { data: expired } = await admin.from("meeting_transcripts").select("id").eq("status", "ready").lt("retention_until", now).limit(100);
  for (const transcript of expired ?? []) {
    await admin.from("meeting_transcript_segments").delete().eq("transcript_id", transcript.id);
    await admin.from("meeting_transcripts").update({ status: "expired", raw_text: null, private_storage_path: null }).eq("id", transcript.id);
  }
  return { meetLinksReconciled: pendingMeetLinks?.length ?? 0, reconciled: completed?.length ?? 0, temporaryFilesChecked: artifacts?.length ?? 0, transcriptsExpired: expired?.length ?? 0 };
}
