import Link from "next/link";
import { submitCase } from "@/app/debtor/cases/actions";
import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getActiveAppointmentForCase } from "@/lib/appointments";
import { caseStatusLabels, getCaseForDebtor, getCaseHistory, isEditableCase } from "@/lib/cases";

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
          </div>
        </section>
      ) : null}

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
                <form action={submitCase}>
                  <input type="hidden" name="case_id" value={item.id} />
                  <Button type="submit" className="rounded-lg font-semibold">ส่งคำขอเข้าสู่การตรวจ</Button>
                </form>
              ) : null}
              {["creditor_accepted", "mediator_matching", "matched"].includes(item.status) ? (
                <Button href={`/debtor/cases/${item.id}/mediator`} className="rounded-lg font-semibold">เลือกผู้ไกล่เกลี่ย</Button>
              ) : null}
              {item.status === "mediator_selected" && !appointment ? (
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
            <div>
              <h3 className="font-semibold">รายละเอียดปัญหา</h3>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{item.problem_description}</p>
            </div>
            <div>
              <h3 className="font-semibold">แนวทางที่ต้องการ</h3>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{item.desired_solution}</p>
            </div>
          </div>

          {appointment ? (
            <div className="mt-6">
              <AppointmentSummaryCard
                appointment={appointment}
                detailHref={`/debtor/cases/${item.id}/appointments/${appointment.id}`}
              />
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">ประวัติสถานะ</h2>
            <div className="mt-4 space-y-3">
              {history.length === 0 ? (
                <p className="text-sm text-[#6B7280]">ยังไม่มีประวัติสถานะ</p>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="rounded-lg bg-[#F8FAFC] p-3">
                    <p className="text-sm font-medium">{caseStatusLabels[entry.to_status]}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{new Date(entry.created_at).toLocaleString("th-TH")}</p>
                    {entry.note ? <p className="mt-2 text-sm text-[#4B5563]">{entry.note}</p> : null}
                  </div>
                ))
              )}
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
