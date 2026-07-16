import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/lib/auth/server";
import { getAppointmentDetail } from "@/lib/appointments";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { approveMinutes, generateMinutesDraft, saveManualTranscript, saveMinutesRevision } from "./actions";

export const dynamic = "force-dynamic";

function textList(value: unknown) {
  if (!Array.isArray(value)) return "";
  return value.map((item) => typeof item === "string" ? item : item && typeof item === "object" && "text" in item ? String(item.text) : "").filter(Boolean).join("\n");
}

export default async function StaffMinutesPage({ params, searchParams }: { params: Promise<{ appointmentId: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile || !["admin", "mediator"].includes(profile.role)) return null;
  const { appointmentId } = await params;
  const query = await searchParams;
  const appointment = await getAppointmentDetail(appointmentId);
  const supabase = await createClient();
  const [{ data: transcript }, { data: minutes }] = await Promise.all([
    supabase.from("meeting_transcripts").select("id, status, raw_text, source, created_at").eq("appointment_id", appointmentId).eq("status", "ready").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("meeting_minutes").select("*").eq("appointment_id", appointmentId).maybeSingle(),
  ]);
  const { data: current } = minutes ? await supabase.from("meeting_minute_versions").select("*").eq("minutes_id", minutes.id).eq("version", minutes.current_version).maybeSingle() : { data: null };
  if (transcript) {
    await createAdminClient().from("audit_logs").insert({ actor_profile_id: profile.id, action: "meeting_transcript.viewed", entity_table: "meeting_transcripts", entity_id: transcript.id, metadata: { appointment_id: appointmentId } });
  }
  const back = profile.role === "admin" ? "/admin/appointments" : `/mediator/appointments/${appointmentId}`;
  return <main className="min-h-screen bg-[#F5F6F8] px-4 py-8"><div className="mx-auto max-w-6xl"><div className="flex flex-wrap items-center justify-between gap-3"><div><Badge>Staff only</Badge><h1 className="mt-3 text-2xl font-bold">Transcript และบันทึกการประชุม</h1><p className="mt-1 text-sm text-[#6B7280]">เคส {appointment.cases?.case_number} · raw transcript ไม่แสดงต่อคู่กรณี</p></div><Button href={back} variant="outline">กลับ</Button></div>
    {query.success ? <Alert variant="success" className="mt-5">{query.success}</Alert> : null}{query.error ? <Alert variant="destructive" className="mt-5">{query.error}</Alert> : null}
    <div className="mt-6 grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="font-semibold">Transcript ภาษาไทย</h2>{transcript ? <><p className="mt-2 text-xs text-[#6B7280]">แหล่งข้อมูล: {transcript.source}</p><pre className="mt-4 max-h-[36rem] overflow-auto whitespace-pre-wrap rounded-lg bg-[#111827] p-4 text-sm leading-6 text-white">{transcript.raw_text}</pre><form action={generateMinutesDraft} className="mt-4"><input type="hidden" name="appointment_id" value={appointmentId}/><Button type="submit">ให้ AI สร้างร่างบันทึก</Button></form></> : <form action={saveManualTranscript} className="mt-4 space-y-3"><input type="hidden" name="appointment_id" value={appointmentId}/><p className="text-sm text-[#6B7280]">หากไม่มี recording หรือ consent ไม่ครบ ให้กรอก transcript/บันทึกเอง แต่ละบรรทัดใช้รูปแบบ “ผู้พูด 1: ...”</p><textarea name="transcript" required className="min-h-80 w-full rounded-lg border border-black/15 p-3"/><Button type="submit">บันทึก transcript แบบ manual</Button></form>}</section>
    <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><h2 className="font-semibold">ร่างบันทึกการประชุม</h2><Badge>{minutes?.status ?? "ยังไม่มี"}</Badge></div>{current ? <form action={saveMinutesRevision} className="mt-4 space-y-3"><input type="hidden" name="appointment_id" value={appointmentId}/><label className="block text-sm font-medium">วัตถุประสงค์<textarea name="objective" defaultValue={current.objective} className="mt-1 min-h-20 w-full rounded-lg border p-3"/></label>{[["key_points","ประเด็นสำคัญ"],["party_positions","จุดยืนแต่ละฝ่าย"],["monetary_proposals","จำนวนเงิน/ข้อเสนอ"],["confirmed_agreements","ข้อตกลงที่ยืนยัน"],["unresolved_issues","ประเด็นที่ยังไม่ตกลง"],["action_items","งานและผู้รับผิดชอบ"],["next_steps","ขั้นตอนถัดไป"]].map(([name,label]) => <label key={name} className="block text-sm font-medium">{label}<textarea name={name} defaultValue={textList(current[name as keyof typeof current])} className="mt-1 min-h-24 w-full rounded-lg border p-3"/></label>)}<div className="flex flex-wrap gap-2"><Button type="submit" variant="outline">บันทึกเป็น version ใหม่</Button><Button formAction={approveMinutes} type="submit">อนุมัติบันทึกการประชุม</Button></div><p className="text-xs text-[#6B7280]">Version {current.version} · การแก้ไขหลังอนุมัติจะสร้าง version ใหม่และต้องอนุมัติอีกครั้ง</p></form> : <p className="mt-4 text-sm text-[#6B7280]">เมื่อ transcript พร้อม ให้กดสร้างร่างด้วย AI</p>}</section></div>
    <Link href={back} className="mt-6 inline-block text-sm font-semibold text-[#8A6500]">กลับหน้าก่อนหน้า</Link></div></main>;
}
