import Link from "next/link";
import { submitCase } from "@/app/debtor/cases/actions";
import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { CaseProgressTracker } from "@/components/cases/case-progress-tracker";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getActiveAppointmentForCase } from "@/lib/appointments";
import { caseStatusLabels, getCaseForDebtor, getCaseHistory, isEditableCase } from "@/lib/cases";
import { getClosingForCase, resultStatusLabels } from "@/lib/closing";
import { getMediatorReviewForCase } from "@/lib/mediator-reviews";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const profile = await requireRole("debtor");
  const { id } = await params;
  const { success, error } = await searchParams;
  const item = await getCaseForDebtor(id, profile.id);
  const history = await getCaseHistory(id);
  const appointment = await getActiveAppointmentForCase(id);
  const closing = await getClosingForCase(id);
  const review = await getMediatorReviewForCase(id);

  return (
    <DebtorShell
      profile={profile}
      activePath="/debtor"
      title={`คำขอ ${item.case_number}`}
      subtitle="รายละเอียดคำขอไกล่เกลี่ยและประวัติสถานะ"
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      {success && isEditableCase(item.status) ? (
        <section className="mb-5 rounded-lg border border-[#F5B800]/40 bg-[#FFF8D9] p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold text-[#111827]">บันทึกใบคำขอสำเร็จ</h2>
              <p className="mt-1 text-sm text-[#6B4F00]">หากตรวจสอบข้อมูลเรียบร้อยแล้ว สามารถส่งคำขอเข้าสู่การตรวจสอบได้ทันที</p>
            </div>
            <form action={submitCase}>
              <input type="hidden" name="case_id" value={item.id} />
              <Button type="submit" className="h-11 rounded-lg font-semibold">ส่งคำขอเข้าสู่การตรวจ</Button>
            </form>
            <Button href={`/debtor/cases/${item.id}/ai`} variant="outline" className="h-11 rounded-lg font-semibold">เปิด AI เตรียมเคส</Button>
          </div>
        </section>
      ) : null}

      <div className="mb-6">
        <CaseProgressTracker caseItem={item} history={history} appointment={appointment} closing={closing} review={review} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-black/5 pb-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge>{caseStatusLabels[item.status]}</Badge>
              <h2 className="mt-3 text-2xl font-semibold">{item.creditor_name}</h2>
              <p className="mt-1 text-sm text-[#6B7280]">{item.debt_type} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isEditableCase(item.status) ? (
                <Button href={`/debtor/cases/${item.id}/edit`} variant="outline" className="rounded-lg">แก้ไขแบบร่าง</Button>
              ) : null}
              {isEditableCase(item.status) ? (
                <Button href={`/debtor/cases/${item.id}/ai`} variant="outline" className="rounded-lg">AI เตรียมเคส</Button>
              ) : null}
              {isEditableCase(item.status) ? (
                <form action={submitCase}>
                  <input type="hidden" name="case_id" value={item.id} />
                  <Button type="submit" className="rounded-lg font-semibold">ส่งคำขอเข้าสู่การตรวจ</Button>
                </form>
              ) : null}
              {["creditor_accepted", "mediator_matching", "matched"].includes(item.status) ? (
                <Button href={`/debtor/cases/${item.id}/mediator`} className="rounded-lg font-semibold">เลือกผู้ไกล่เกลี่ย</Button>
              ) : null}
              {(["mediator_selected", "appointment_scheduling"].includes(item.status) && !appointment) || appointment?.status === "reschedule_requested" ? (
                <Button href={`/debtor/cases/${item.id}/appointments/new`} className="rounded-lg font-semibold">เลือกเวลานัดหมาย</Button>
              ) : null}
            </div>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-[#6B7280]">ประเภทเจ้าหนี้</dt><dd className="mt-1 font-medium">{item.creditor_type}</dd></div>
            <div><dt className="text-sm text-[#6B7280]">ค้างชำระ</dt><dd className="mt-1 font-medium">{item.overdue_months} เดือน</dd></div>
            <div><dt className="text-sm text-[#6B7280]">พื้นที่</dt><dd className="mt-1 font-medium">{item.district}, {item.province}</dd></div>
            <div><dt className="text-sm text-[#6B7280]">เบอร์ติดต่อ</dt><dd className="mt-1 font-medium">{item.contact_phone}</dd></div>
          </dl>

          <div className="mt-6 space-y-5">
            {item.admin_review_note && ["needs_more_info", "closed"].includes(item.status) ? (
              <div>
                <h3 className="font-semibold text-[#92400E]">ข้อความจากผู้ดูแลระบบ</h3>
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-[#78350F]">
                  <p className="font-semibold">{item.status === "needs_more_info" ? "กรุณาส่งข้อมูลเพิ่มเติม" : "เหตุผลที่ปิดเคส"}</p>
                  <p className="mt-2 whitespace-pre-line">{item.admin_review_note}</p>
                </div>
              </div>
            ) : null}
            <div>
              <h3 className="font-semibold">รายละเอียดปัญหา</h3>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{item.problem_description}</p>
            </div>
            <div>
              <h3 className="font-semibold">แนวทางที่ต้องการ</h3>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{item.desired_solution}</p>
            </div>
            {item.creditor_response_note || item.rejection_reason ? (
              <div>
                <h3 className="font-semibold">ข้อความจากเจ้าหนี้</h3>
                <div className="mt-2 rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">
                  {item.creditor_response_note ? <p className="whitespace-pre-line">{item.creditor_response_note}</p> : null}
                  {item.rejection_reason ? <p className="mt-3 whitespace-pre-line text-[#B91C1C]">เหตุผลเพิ่มเติม: {item.rejection_reason}</p> : null}
                </div>
              </div>
            ) : null}
          </div>

          {appointment ? (
            <div className="mt-6">
              <AppointmentSummaryCard
                appointment={appointment}
                detailHref={`/debtor/cases/${item.id}/appointments/${appointment.id}`}
              />
            </div>
          ) : null}
          {closing ? (
            <section className="mt-6 rounded-lg border border-black/5 bg-[#F8FAFC] p-5">
              <h2 className="font-semibold">เอกสารปิดเคส</h2>
              <p className="mt-1 text-sm text-[#6B7280]">{resultStatusLabels[closing.result_status]}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {closing.settlement_documents?.map((doc) => (
                  <Button key={doc.id} href={`/documents/settlements/${doc.id}`} variant="outline" className="rounded-lg">เปิดเอกสาร/ลงนาม</Button>
                ))}
              </div>
            </section>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">สถานะปัจจุบัน</h2>
            <p className="mt-2 text-sm text-[#6B7280]">ติดตามรายละเอียดลำดับงานได้จาก Case Progress ด้านบน</p>
            <div className="mt-4 rounded-lg bg-[#F8FAFC] p-3">
              <p className="text-sm text-[#6B7280]">อัปเดตล่าสุด</p>
              <p className="mt-1 font-semibold">{new Date(item.updated_at).toLocaleString("th-TH")}</p>
            </div>
          </section>
          <Link href="/debtor" className="block text-center text-sm font-semibold text-[#8A6500] hover:text-[#111827]">
            กลับแดชบอร์ด
          </Link>
        </aside>
      </div>
    </DebtorShell>
  );
}
