import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/admin/auth";
import { caseStatusLabels, getAdminCaseQueue, getCaseComments, getCaseHistory } from "@/lib/cases";
import { createClient } from "@/lib/supabase/server";
import { rejectCaseByAdmin, requestCaseMoreInfo, sendCaseToCreditorReview } from "@/app/admin/cases/actions";

export const dynamic = "force-dynamic";

export default async function AdminCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ caseId?: string; success?: string; error?: string }>;
}) {
  const profile = await requireAdmin();
  const { caseId, success, error } = await searchParams;
  const cases = await getAdminCaseQueue();
  const selectedId = caseId ?? cases[0]?.id;
  const selectedCase = selectedId ? cases.find((item) => item.id === selectedId) ?? await getAnyCase(selectedId) : null;
  const history = selectedCase ? await getCaseHistory(selectedCase.id) : [];
  const comments = selectedCase ? await getCaseComments(selectedCase.id) : [];

  return (
    <AdminShell profile={profile} activePath="/admin/cases" title="Case Review" subtitle="ตรวจสอบคำขอที่ลูกหนี้ส่งเข้าระบบและส่งต่อให้เจ้าหนี้">
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <section className="rounded-lg border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4">
            <h2 className="font-semibold">Submitted cases queue</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{cases.length.toLocaleString("th-TH")} เคสรอการดำเนินการ</p>
          </div>
          <div className="divide-y divide-black/5">
            {cases.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#6B7280]">ไม่มีเคสรอตรวจสอบ</p>
            ) : cases.map((item) => (
              <Link key={item.id} href={`/admin/cases?caseId=${item.id}`} className={`block px-5 py-4 hover:bg-[#FFFBEA] ${item.id === selectedCase?.id ? "bg-[#FFF8D9]" : ""}`}>
                <p className="font-semibold">{item.case_number}</p>
                <p className="mt-1 text-sm text-[#6B7280]">{item.creditor_name} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>
                <Badge className="mt-2">{caseStatusLabels[item.status]}</Badge>
              </Link>
            ))}
          </div>
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
                <CaseAction action={sendCaseToCreditorReview} caseId={selectedCase.id} label="ส่งให้เจ้าหนี้" />
                <CaseAction action={requestCaseMoreInfo} caseId={selectedCase.id} label="ขอข้อมูลเพิ่ม" variant="outline" />
                <CaseAction action={rejectCaseByAdmin} caseId={selectedCase.id} label="ปฏิเสธ" variant="outline" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Info label="ยอดหนี้" value={`${Number(selectedCase.debt_amount).toLocaleString("th-TH")} บาท`} />
              <Info label="ค้างชำระ" value={`${selectedCase.overdue_months} เดือน`} />
              <Info label="เบอร์ติดต่อ" value={selectedCase.contact_phone} />
              <Info label="รายได้/เดือน" value={`${Number(selectedCase.monthly_income ?? 0).toLocaleString("th-TH")} บาท`} />
              <Info label="ค่าใช้จ่าย/เดือน" value={`${Number(selectedCase.monthly_expense ?? 0).toLocaleString("th-TH")} บาท`} />
              <Info label="ผ่อนได้/เดือน" value={`${Number(selectedCase.affordable_monthly_payment ?? 0).toLocaleString("th-TH")} บาท`} />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <TextPanel title="รายละเอียดปัญหา" value={selectedCase.problem_description} />
              <TextPanel title="ข้อเสนอที่ต้องการ" value={selectedCase.desired_solution} />
            </div>

            <form action={sendCaseToCreditorReview} className="mt-6 rounded-lg bg-[#F8FAFC] p-4">
              <input type="hidden" name="case_id" value={selectedCase.id} />
              <label className="block">
                <span className="text-sm font-medium">Internal note</span>
                <textarea name="note" className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="บันทึกภายในสำหรับทีมผู้ดูแล" />
              </label>
              <Button type="submit" className="mt-3 rounded-lg font-semibold">บันทึก note และส่งให้เจ้าหนี้</Button>
            </form>

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

function CaseAction({ action, caseId, label, variant = "default" }: { action: (formData: FormData) => Promise<void>; caseId: string; label: string; variant?: "default" | "outline" }) {
  return (
    <form action={action}>
      <input type="hidden" name="case_id" value={caseId} />
      <Button type="submit" variant={variant} className="rounded-lg font-semibold">{label}</Button>
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
