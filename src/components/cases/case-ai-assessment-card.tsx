import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { reviewCaseAiAssessment } from "@/app/admin/cases/actions";

function list(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export async function CaseAiAssessmentCard({ caseId, allowAdminReview = false }: { caseId: string; allowAdminReview?: boolean }) {
  const supabase = await createClient();
  const [{ data: session }, { data: assessment }, { data: plans }] = await Promise.all([
    supabase.from("case_ai_sessions").select("summary, strengths, benefits, status").eq("case_id", caseId).maybeSingle(),
    supabase.from("case_ai_assessments").select("*").eq("case_id", caseId).order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("case_payment_plans").select("*").eq("case_id", caseId).order("monthly_payment"),
  ]);
  if (!session) return <section className="rounded-lg bg-[#F8FAFC] p-4 text-sm text-[#6B7280]">เคสนี้ยังไม่มีผลการเตรียมเคสด้วย AI</section>;
  return <section className="rounded-xl border border-[#E5E7EB] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">AI Case Preparation</h3>{assessment ? <Badge>ความเสี่ยง {assessment.risk_score}/100 · {assessment.risk_level}</Badge> : <Badge>{session.status}</Badge>}</div><p className="mt-3 whitespace-pre-line text-sm leading-6 text-[#374151]">{session.summary || "ยังไม่มีสรุป"}</p>{assessment ? <div className="mt-4 rounded-lg bg-[#FFF8D9] p-3 text-sm"><p className="font-semibold">คำอธิบายผลประเมิน</p><p className="mt-1 leading-6">{assessment.rationale}</p><p className="mt-2 text-xs">สถานะตรวจ: {assessment.review_status}</p></div> : null}<div className="mt-4 grid gap-4 sm:grid-cols-2"><div><p className="text-sm font-semibold">จุดแข็ง</p><ul className="mt-1 list-disc pl-5 text-sm">{list(session.strengths).map((item) => <li key={item}>{item}</li>)}</ul></div><div><p className="text-sm font-semibold">แผนที่ลูกหนี้เลือก</p>{plans?.filter((plan) => plan.status === "selected").map((plan) => <p key={plan.id} className="mt-1 text-sm">{plan.plan_type === "light_payment" ? "ค่างวดเบา" : "ปิดเร็ว"}: {Number(plan.monthly_payment).toLocaleString("th-TH")} บาท × {plan.term_months} เดือน</p>)}</div></div>{allowAdminReview && assessment ? <form action={reviewCaseAiAssessment} className="mt-4 grid gap-2 rounded-lg bg-[#F8FAFC] p-3"><input type="hidden" name="case_id" value={caseId}/><input type="hidden" name="assessment_id" value={assessment.id}/><textarea name="review_note" className="min-h-16 rounded-lg border p-2 text-sm" placeholder="หมายเหตุการตรวจ"/><div className="flex gap-2"><Button type="submit" name="review_status" value="approved">อนุมัติผลประเมิน</Button><Button type="submit" name="review_status" value="needs_correction" variant="outline">ให้แก้ไข</Button></div></form> : null}</section>;
}
