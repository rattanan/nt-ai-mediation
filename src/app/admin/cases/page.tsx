import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPage, paginateItems, Pagination } from "@/components/ui/pagination";
import { CaseAiAssessmentCard } from "@/components/cases/case-ai-assessment-card";
import { requireAdmin } from "@/lib/admin/auth";
import { caseStatusLabels, getCaseComments, getCaseHistory } from "@/lib/cases";
import { getClosingForCase, resultStatusLabels } from "@/lib/closing";
import { getLatestAppointmentForCase } from "@/lib/appointments";
import { getMediatorProfile } from "@/lib/mediators";
import { getCreditorResponses } from "@/lib/creditor";
import { createClient } from "@/lib/supabase/server";
import { rejectCaseByAdmin, requestCaseMoreInfo, sendCaseToCreditorReview } from "@/app/admin/cases/actions";

const activeStatuses = ["submitted", "reviewing", "admin_review", "needs_more_info", "creditor_review", "creditor_accepted", "mediator_matching", "matched", "mediator_selected", "appointment_scheduling", "scheduled", "in_mediation", "settlement_draft"] as const;
const completedStatuses = ["settled", "closed", "not_settled", "creditor_rejected"] as const;

export const dynamic = "force-dynamic";

export default async function AdminCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string; page?: string; success?: string; error?: string; tab?: "active" | "completed" }>;
}) {
  const profile = await requireAdmin();
  const { caseId, page: pageParam, success, error, tab = "active" } = await searchParams;
  const cases = await getAllCases();
  const filteredCases = cases.filter((item) => (tab === "completed" ? completedStatuses.includes(item.status as (typeof completedStatuses)[number]) : activeStatuses.includes(item.status as (typeof activeStatuses)[number])));
  const pageSize = 10;
  const { page, pageItems: pagedCases } = paginateItems(filteredCases, getPage(pageParam), pageSize);
  const selectedId = caseId ?? filteredCases[0]?.id;
  const selectedCase = selectedId ? filteredCases.find((item) => item.id === selectedId) ?? await getAnyCase(selectedId) : null;
  const history = selectedCase ? await getCaseHistory(selectedCase.id) : [];
  const comments = selectedCase ? await getCaseComments(selectedCase.id) : [];
  const creditorResponses = selectedCase?.creditor_organization_id ? await getCreditorResponses(selectedCase.id, selectedCase.creditor_organization_id) : [];
  const closing = selectedCase ? await getClosingForCase(selectedCase.id) : null;
  const appointment = selectedCase ? await getLatestAppointmentForCase(selectedCase.id) : null;
  const selectedMediator = selectedCase?.selected_mediator_profile_id
    ? await getMediatorProfile(selectedCase.selected_mediator_profile_id)
    : null;

  return (
    <AdminShell profile={profile} activePath="/admin/cases" title="Case Review" subtitle="ตรวจสอบคำขอที่ลูกหนี้ส่งเข้าระบบและจัดการงานระหว่างรอเจ้าหนี้พิจารณา">
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <div className="mb-5 flex gap-2">
        <Button href="/admin/cases?tab=active" variant={tab === "active" ? "default" : "outline"} className="rounded-lg font-semibold">Active Cases</Button>
        <Button href="/admin/cases?tab=completed" variant={tab === "completed" ? "default" : "outline"} className="rounded-lg font-semibold">Completed Cases</Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <section className="rounded-lg border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4">
            <h2 className="font-semibold">{tab === "completed" ? "Completed Cases" : "Active Cases"}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{filteredCases.length.toLocaleString("th-TH")} เคส</p>
          </div>
          <div className="divide-y divide-black/5">
            {filteredCases.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#6B7280]">ไม่มีเคสรอตรวจสอบ</p>
            ) : pagedCases.map((item) => (
              <Link key={item.id} href={`/admin/cases?${new URLSearchParams({ caseId: item.id, ...(page > 1 ? { page: String(page) } : {}) }).toString()}`} className={`block px-5 py-4 hover:bg-[#FFFBEA] ${item.id === selectedCase?.id ? "bg-[#FFF8D9]" : ""}`}>
                <p className="font-semibold">{item.case_number}</p>
                <p className="mt-1 text-sm text-[#6B7280]">{item.creditor_name} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>
                <Badge className="mt-2">{caseStatusLabels[item.status]}</Badge>
              </Link>
              ))}
          </div>
          <Pagination basePath="/admin/cases" params={{ caseId, tab }} page={page} pageSize={pageSize} total={filteredCases.length} />
        </section>

        {selectedCase ? (
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-black/5 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge>{caseStatusLabels[selectedCase.status]}</Badge>
                <h2 className="mt-3 text-2xl font-semibold">{selectedCase.case_number}</h2>
                <p className="mt-1 text-sm text-[#6B7280]">{selectedCase.creditor_name} · {selectedCase.debt_type}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {tab === "active" && ["submitted", "reviewing", "admin_review"].includes(selectedCase.status) ? (
                  <CaseAction action={sendCaseToCreditorReview} caseId={selectedCase.id} label="ส่งให้เจ้าหนี้พิจารณา" />
                ) : tab === "completed" ? (
                  <span className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#6B7280]">เคสที่สำเร็จแล้วจัดการได้เฉพาะการดูรายละเอียด</span>
                ) : <span className="rounded-lg bg-[#F8FAFC] px-3 py-2 text-sm text-[#6B7280]">กำลังรอผู้รับผิดชอบในขั้นตอนปัจจุบันดำเนินการ</span>}
              </div>
            </div>

            {tab === "active" && ["submitted", "reviewing", "admin_review"].includes(selectedCase.status) ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <DetailedCaseAction action={requestCaseMoreInfo} caseId={selectedCase.id} label="ขอข้อมูลเพิ่มเติม" placeholder="ระบุข้อมูลหรือเอกสารที่ต้องการให้ลูกหนี้ส่งเพิ่มเติม" />
                <DetailedCaseAction action={rejectCaseByAdmin} caseId={selectedCase.id} label="ปิดเคส" placeholder="ระบุเหตุผลที่ปิดเคสเพื่อแจ้งให้ลูกหนี้ทราบ" destructive />
              </div>
            ) : null}

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Info label="ยอดหนี้" value={`${Number(selectedCase.debt_amount).toLocaleString("th-TH")} บาท`} />
              <Info label="ค้างชำระ" value={`${selectedCase.overdue_months} เดือน`} />
              <Info label="เบอร์ติดต่อ" value={selectedCase.contact_phone} />
              <Info label="รายได้/เดือน" value={`${Number(selectedCase.monthly_income ?? 0).toLocaleString("th-TH")} บาท`} />
              <Info label="ค่าใช้จ่าย/เดือน" value={`${Number(selectedCase.monthly_expense ?? 0).toLocaleString("th-TH")} บาท`} />
              <Info label="ผ่อนได้/เดือน" value={`${Number(selectedCase.affordable_monthly_payment ?? 0).toLocaleString("th-TH")} บาท`} />
            </div>
            <div className="mt-6"><CaseAiAssessmentCard caseId={selectedCase.id} allowAdminReview /></div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <TextPanel title="รายละเอียดปัญหา" value={selectedCase.problem_description} />
              <TextPanel title="ข้อเสนอที่ต้องการ" value={selectedCase.desired_solution} />
            </div>

            {(selectedCase.selected_mediator_profile_id || appointment) ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Info label="ผู้ไกล่เกลี่ย" value={selectedMediator ? `${selectedMediator.title ?? ""} ${selectedMediator.first_name} ${selectedMediator.last_name}`.trim() : "เลือกแล้ว (ไม่พบรายละเอียดโปรไฟล์)"} />
                <Info label="วันเวลานัดหมาย" value={appointment ? `${new Date(`${appointment.appointment_date}T${appointment.start_time}`).toLocaleDateString("th-TH")} เวลา ${appointment.start_time.slice(0, 5)}–${appointment.end_time.slice(0, 5)} น.` : "ยังไม่ได้นัดหมาย"} />
              </div>
            ) : null}

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <TextPanel
                title="รายละเอียดข้อตกลงจากเจ้าหนี้"
                value={selectedCase.creditor_response_note || "ยังไม่มีการแจ้งข้อตกลงจากเจ้าหนี้"}
              />
              <TextPanel
                title="ข้อตกลงปิดเคส"
                value={closing?.settlement_summary || (closing ? resultStatusLabels[closing.result_status] : "ยังไม่มีข้อตกลงปิดเคส")}
              />
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">ประวัติการตอบกลับของเจ้าหนี้</h3>
              <div className="mt-3 space-y-2">
                {creditorResponses.length === 0 ? (
                  <p className="text-sm text-[#6B7280]">ยังไม่มีการตอบกลับจากเจ้าหนี้</p>
                ) : creditorResponses.map((response) => (
                  <div key={response.id} className="rounded-lg bg-[#F8FAFC] p-3 text-sm">
                    <p className="font-semibold">{response.response}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{new Date(response.created_at).toLocaleString("th-TH")}</p>
                    {response.reason ? <p className="mt-2 whitespace-pre-line">{response.reason}</p> : null}
                    {response.proposed_terms ? <p className="mt-2 whitespace-pre-line">{response.proposed_terms}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            {["submitted", "reviewing", "admin_review"].includes(selectedCase.status) ? <form action={sendCaseToCreditorReview} className="mt-6 rounded-lg bg-[#F8FAFC] p-4">
              <input type="hidden" name="case_id" value={selectedCase.id} />
              <label className="block">
                <span className="text-sm font-medium">Internal note</span>
                <textarea name="note" className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="บันทึกภายในสำหรับทีมผู้ดูแล" />
              </label>
              <Button type="submit" className="mt-3 rounded-lg font-semibold">บันทึก note และส่งให้เจ้าหนี้</Button>
            </form> : null}

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Timeline title="ประวัติสถานะ" items={history.map((item) => `${caseStatusLabels[item.to_status]}${item.note ? ` - ${item.note}` : ""}`)} />
              <Timeline title="ความคิดเห็น" items={comments.map((item) => item.comment)} />
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}

async function getAnyCase(caseId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("cases").select("*").eq("id", caseId).maybeSingle();
  return data;
}

async function getAllCases() {
  const supabase = await createClient();
  const { data } = await supabase.from("cases").select("*").order("updated_at", { ascending: false });
  return data ?? [];
}

function CaseAction({ action, caseId, label, variant = "default" }: { action: (formData: FormData) => Promise<void>; caseId: string; label: string; variant?: "default" | "outline" }) {
  return (
    <form action={action}>
      <input type="hidden" name="case_id" value={caseId} />
      <Button type="submit" variant={variant} className="rounded-lg font-semibold">{label}</Button>
    </form>
  );
}

function DetailedCaseAction({ action, caseId, label, placeholder, destructive = false }: { action: (formData: FormData) => Promise<void>; caseId: string; label: string; placeholder: string; destructive?: boolean }) {
  return (
    <form action={action} className="rounded-lg border border-black/5 bg-[#F8FAFC] p-4">
      <input type="hidden" name="case_id" value={caseId} />
      <label className="block text-sm font-medium">รายละเอียดที่จะแสดงให้ลูกหนี้เห็น</label>
      <textarea name="note" required className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 py-2 text-sm" placeholder={placeholder} />
      <Button type="submit" variant="outline" className={destructive ? "mt-3 rounded-lg border-red-200 font-semibold text-red-700 hover:bg-red-50" : "mt-3 rounded-lg font-semibold"}>{label}</Button>
    </form>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[#F8FAFC] p-4"><p className="text-sm text-[#6B7280]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function TextPanel({ title, value }: { title: string; value: string }) {
  return <div><h3 className="font-semibold">{title}</h3><p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{value}</p></div>;
}

function Timeline({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="font-semibold">{title}</h3><div className="mt-3 space-y-2">{items.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีข้อมูล</p> : items.map((item, index) => <p key={index} className="rounded-lg bg-[#F8FAFC] p-3 text-sm">{item}</p>)}</div></div>;
}
