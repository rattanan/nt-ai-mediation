import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { InterviewAnswerSubmit, StartAiInterviewSubmit } from "@/components/debtor/ai-interview-submit";
import { requireRole } from "@/lib/auth/server";
import { MAX_AI_INTERVIEW_QUESTIONS } from "@/lib/ai/interview";
import { getCaseForDebtor } from "@/lib/cases";
import { createClient } from "@/lib/supabase/server";
import { requestManualBypass, selectPaymentPlan, startAiPreparation, submitInterviewAnswer } from "./actions";

export const dynamic = "force-dynamic";

function list(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

export default async function AiCasePreparationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const profile = await requireRole("debtor");
  const { id } = await params;
  const query = await searchParams;
  const caseItem = await getCaseForDebtor(id, profile.id);
  const supabase = await createClient();
  const [{ data: session }, { data: messages }, { data: plans }, { data: jobs }, { data: documents }] = await Promise.all([
    supabase.from("case_ai_sessions").select("*").eq("case_id", id).maybeSingle(),
    supabase.from("case_ai_messages").select("*").eq("case_id", id).order("sequence"),
    supabase.from("case_payment_plans").select("*").eq("case_id", id).order("monthly_payment"),
    supabase.from("ai_processing_jobs").select("attempts, status").eq("case_id", id).order("created_at", { ascending: false }).limit(1),
    supabase.from("case_documents").select("id, file_name, ocr_status, retry_count").eq("case_id", id),
  ]);
  const lastMessage = messages?.at(-1);
  const canBypass = jobs?.[0]?.status === "failed" && jobs[0].attempts >= 3;

  return <DebtorShell profile={profile} activePath="/debtor/interviews" title="AI ช่วยเตรียมเคส" subtitle={`คำขอ ${caseItem.case_number} · ตรวจข้อมูลก่อนส่งให้เจ้าหน้าที่`}>
    {query.success ? <Alert variant="success" className="mb-5">{query.success}</Alert> : null}
    {query.error ? <Alert variant="destructive" className="mb-5">{query.error}</Alert> : null}

    <div className="grid gap-6 xl:grid-cols-[1fr_22rem]">
      <main className="space-y-5">
        <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><Badge>ขั้นตอนก่อนส่งเคส</Badge><h2 className="mt-3 text-xl font-semibold">อ่านเอกสารและสัมภาษณ์ข้อมูลที่ยังขาด</h2></div>
          <form action={startAiPreparation}><input type="hidden" name="case_id" value={id}/><StartAiInterviewSubmit hasSession={Boolean(session)} /></form></div>
          {documents?.length ? <div className="mt-4 grid gap-2 sm:grid-cols-2">{documents.map((document) => <div key={document.id} className="rounded-lg bg-[#F8FAFC] p-3 text-sm"><p className="font-medium">{document.file_name}</p><p className="mt-1 text-[#6B7280]">OCR: {document.ocr_status} · ลองแล้ว {document.retry_count}/3</p></div>)}</div> : <p className="mt-4 text-sm text-[#6B7280]">ไม่มีเอกสารแนบ ระบบจะใช้ข้อมูลจากแบบฟอร์มและการสัมภาษณ์</p>}
        </section>

        {messages?.length ? <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="font-semibold">การสัมภาษณ์</h2><div className="mt-4 space-y-3">{messages.map((message) => <div key={message.id} className={`max-w-[88%] rounded-xl p-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-[#111827] text-white" : "bg-[#FFF3BF] text-[#3F2D00]"}`}>{message.content}</div>)}</div>
          {session?.status === "interview" && lastMessage?.role === "assistant" ? <form action={submitInterviewAnswer} className="mt-4 space-y-3"><input type="hidden" name="case_id" value={id}/><textarea name="answer" maxLength={2000} required className="min-h-28 w-full rounded-lg border border-black/15 p-3" placeholder="ตอบตามจริง หากไม่ทราบให้พิมพ์ว่า ไม่ทราบ"/><InterviewAnswerSubmit /></form> : null}
        </section> : null}

        {session?.summary ? <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="font-semibold">สรุปเคส</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#374151]">{session.summary}</p><div className="mt-5 grid gap-4 md:grid-cols-2"><div><h3 className="font-semibold">จุดแข็ง</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{list(session.strengths).map((item) => <li key={item}>{item}</li>)}</ul></div><div><h3 className="font-semibold">ประโยชน์ของการไกล่เกลี่ย</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm">{list(session.benefits).map((item) => <li key={item}>{item}</li>)}</ul></div></div><p className="mt-4 text-xs text-[#6B7280]">คะแนนความเสี่ยงแสดงเฉพาะเจ้าหน้าที่ เจ้าหนี้ และผู้ไกล่เกลี่ยที่รับผิดชอบ</p></section> : null}

        {plans?.length ? <section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="font-semibold">เลือกแผนที่จะเสนอเจ้าหนี้</h2><div className="mt-4 grid gap-4 md:grid-cols-2">{plans.map((plan) => <article key={plan.id} className={`rounded-xl border p-4 ${plan.status === "selected" ? "border-[#D8A400] bg-[#FFF8D9]" : "border-black/10"}`}><h3 className="font-semibold">{plan.plan_type === "light_payment" ? "แผนค่างวดเบา" : "แผนปิดเร็ว"}</h3><p className="mt-3 text-2xl font-bold">{Number(plan.monthly_payment).toLocaleString("th-TH")} <span className="text-sm font-normal">บาท/เดือน</span></p><p className="mt-2 text-sm text-[#6B7280]">{plan.term_months} เดือน · รวมประมาณ {Number(plan.total_payment).toLocaleString("th-TH")} บาท</p><p className="mt-1 text-xs text-[#6B7280]">สมมติฐานดอกเบี้ย {plan.assumed_interest_rate}% · ส่วนลด {plan.assumed_discount_rate}% (ต้องรอเจ้าหนี้ยืนยัน)</p><form action={selectPaymentPlan} className="mt-4"><input type="hidden" name="case_id" value={id}/><input type="hidden" name="plan_id" value={plan.id}/><Button type="submit" variant={plan.status === "selected" ? "outline" : "default"} disabled={plan.status === "selected"}>{plan.status === "selected" ? "เลือกแล้ว" : "เลือกแผนนี้"}</Button></form></article>)}</div></section> : null}
      </main>
      <aside className="space-y-4"><section className="rounded-xl border border-black/5 bg-white p-5 shadow-sm"><h2 className="font-semibold">สถานะ</h2><p className="mt-2 text-sm text-[#6B7280]">{session?.status ?? "ยังไม่เริ่ม"} · คำถาม {Math.min(session?.question_count ?? 0, MAX_AI_INTERVIEW_QUESTIONS)}/{MAX_AI_INTERVIEW_QUESTIONS}</p>{session?.status === "manual_bypass" ? <Alert className="mt-3">ไม่พบแผนที่ชำระจบภายใน 120 เดือน ระบบจะติดธงให้เจ้าหน้าที่ตรวจด้วยตนเอง</Alert> : null}{session && ["completed", "manual_bypass"].includes(session.status) ? <Button href={`/debtor/cases/${id}`} className="mt-4 w-full">กลับไปส่งคำขอ</Button> : null}</section>{canBypass ? <form action={requestManualBypass} className="rounded-xl border border-amber-200 bg-amber-50 p-5"><input type="hidden" name="case_id" value={id}/><h2 className="font-semibold text-amber-900">ระบบล้มเหลวครบ 3 ครั้ง</h2><p className="mt-2 text-sm text-amber-800">ส่งต่อให้แอดมินตรวจข้อมูลด้วยตนเองได้</p><Button type="submit" variant="outline" className="mt-4">ขอตรวจแบบ manual</Button></form> : null}<Link href={`/debtor/cases/${id}`} className="block text-center text-sm font-semibold text-[#8A6500]">กลับรายละเอียดคำขอ</Link></aside>
    </div>
  </DebtorShell>;
}
