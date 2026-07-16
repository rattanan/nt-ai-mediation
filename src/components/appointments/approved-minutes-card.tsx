import { createClient } from "@/lib/supabase/server";

function list(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => typeof item === "string" ? item : item && typeof item === "object" && "text" in item ? String(item.text) : "").filter(Boolean);
}

export async function ApprovedMinutesCard({ appointmentId }: { appointmentId: string }) {
  const supabase = await createClient();
  const { data: minutes } = await supabase.from("meeting_minutes").select("id, status, approved_at").eq("appointment_id", appointmentId).eq("status", "approved").maybeSingle();
  const { data: version } = minutes ? await supabase.from("meeting_minute_versions").select("*").eq("minutes_id", minutes.id).eq("status", "approved").order("version", { ascending: false }).limit(1).maybeSingle() : { data: null };
  if (!minutes || !version) return null;
  return <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5"><h2 className="font-semibold text-emerald-950">บันทึกการประชุมที่อนุมัติแล้ว</h2><p className="mt-1 text-xs text-emerald-800">อนุมัติ {minutes.approved_at ? new Date(minutes.approved_at).toLocaleString("th-TH") : "-"}</p><h3 className="mt-4 text-sm font-semibold">วัตถุประสงค์</h3><p className="mt-1 text-sm leading-6">{version.objective}</p>{[["confirmed_agreements","ข้อตกลง"],["unresolved_issues","ประเด็นที่ยังไม่ตกลง"],["action_items","งานที่ต้องดำเนินการ"],["next_steps","ขั้นตอนถัดไป"]].map(([field,label]) => { const items = list(version[field as keyof typeof version]); return items.length ? <div key={field} className="mt-4"><h3 className="text-sm font-semibold">{label}</h3><ul className="mt-1 list-disc space-y-1 pl-5 text-sm">{items.map((item) => <li key={item}>{item}</li>)}</ul></div> : null; })}</section>;
}
