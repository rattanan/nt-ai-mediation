import { recordAppointmentRecordingConsent } from "@/app/appointments/actions";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export async function RecordingConsentCard({ appointmentId }: { appointmentId: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || !["debtor", "creditor", "mediator"].includes(profile.role)) return null;
  const { data: consent } = await supabase.from("appointment_recording_consents").select("consented, consented_at, revoked_at").eq("appointment_id", appointmentId).eq("participant_profile_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
    <h2 className="font-semibold">ความยินยอมบันทึกเสียง</h2>
    <p className="mt-2 text-sm leading-6 text-[#6B7280]">ใช้เพื่อถอดเสียงภาษาไทยและร่างบันทึกการประชุมเท่านั้น ต้องยินยอมครบทั้งลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ยจึงจะเปิดบันทึกอัตโนมัติ</p>
    {consent ? <p className="mt-3 text-sm font-semibold">สถานะ: {consent.consented && !consent.revoked_at ? "ยินยอม" : "ไม่ยินยอม"}</p> : null}
    <form action={recordAppointmentRecordingConsent} className="mt-4 flex gap-2"><input type="hidden" name="appointment_id" value={appointmentId}/><Button type="submit" name="consented" value="true" variant="outline">ยินยอม</Button><Button type="submit" name="consented" value="false" variant="outline">ไม่ยินยอม</Button></form>
  </section>;
}
