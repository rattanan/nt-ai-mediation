import Link from "next/link";
import { CheckCircle2, ClipboardList, Clock3, FilePlus2, FolderOpen } from "lucide-react";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, getPage, paginateItems } from "@/components/ui/pagination";
import { requireRole } from "@/lib/auth/server";
import { getDebtorCases, isActiveCase, caseStatusLabels } from "@/lib/cases";
import { getAppointmentsForDebtor, isUpcomingAppointment } from "@/lib/appointments";
import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";

export const dynamic = "force-dynamic";

function SummaryCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof ClipboardList }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2A8]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold">{value.toLocaleString("th-TH")}</p>
    </div>
  );
}

export default async function DebtorCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireRole("debtor");
  const { page: pageParam } = await searchParams;
  const pageSize = 5;
  const allCases = await getDebtorCases(profile.id);
  const { page, pageItems: pagedCases, total } = paginateItems(allCases, getPage(pageParam), pageSize);
  const appointments = await getAppointmentsForDebtor(profile.id);
  const upcomingAppointment = appointments.find(isUpcomingAppointment);
  const submittedCount = allCases.filter((item) => item.status === "submitted" || item.status === "reviewing").length;
  const activeCount = allCases.filter((item) => isActiveCase(item.status)).length;
  const closedCount = allCases.filter((item) => item.status === "closed" || item.status === "settled" || item.status === "not_settled").length;

  return (
    <DebtorShell profile={profile} activePath="/debtor/cases" title="ใบคำขอ" subtitle="ติดตามคำขอไกล่เกลี่ยและสถานะการดำเนินการของคุณ">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="คำขอทั้งหมด" value={allCases.length} icon={ClipboardList} />
        <SummaryCard label="ส่งตรวจสอบแล้ว" value={submittedCount} icon={Clock3} />
        <SummaryCard label="เคสที่กำลังดำเนินการ" value={activeCount} icon={FolderOpen} />
        <SummaryCard label="เคสที่ปิดแล้ว" value={closedCount} icon={CheckCircle2} />
      </section>

      {upcomingAppointment ? (
        <div className="mt-6">
          <AppointmentSummaryCard
            appointment={upcomingAppointment}
            detailHref={`/debtor/cases/${upcomingAppointment.case_id}/appointments/${upcomingAppointment.id}`}
          />
        </div>
      ) : null}

      <section className="mt-6 rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-black/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">รายการคำขอไกล่เกลี่ย</h2>
            <p className="mt-1 text-sm text-[#6B7280]">สร้าง แก้ไขแบบร่าง และติดตามสถานะคำขอของคุณ</p>
          </div>
          <Button href="/debtor/cases/new" className="rounded-lg font-semibold">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            สร้างคำขอใหม่
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
              <tr>
                <th className="px-5 py-3">เลขคำขอ</th>
                <th className="px-5 py-3">เจ้าหนี้</th>
                <th className="px-5 py-3">ยอดหนี้</th>
                <th className="px-5 py-3">สถานะ</th>
                <th className="px-5 py-3">อัปเดตล่าสุด</th>
                <th className="px-5 py-3" aria-label="รายละเอียด" />
              </tr>
            </thead>
            <tbody>
              {pagedCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="font-semibold">ยังไม่มีคำขอไกล่เกลี่ย</p>
                    <p className="mt-2 text-sm text-[#6B7280]">เริ่มสร้างคำขอแรกเพื่อเข้าสู่กระบวนการไกล่เกลี่ยดิจิทัล</p>
                  </td>
                </tr>
              ) : (
                pagedCases.map((item) => (
                  <tr key={item.id} className="border-t border-black/5">
                    <td className="px-5 py-4 font-medium">{item.case_number}</td>
                    <td className="px-5 py-4">{item.creditor_name}</td>
                    <td className="px-5 py-4">{Number(item.debt_amount).toLocaleString("th-TH")} บาท</td>
                    <td className="px-5 py-4"><Badge>{caseStatusLabels[item.status]}</Badge></td>
                    <td className="px-5 py-4 text-[#6B7280]">{new Date(item.updated_at).toLocaleDateString("th-TH")}</td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/debtor/cases/${item.id}`} className="font-semibold text-[#8A6500] hover:text-[#111827]">
                        รายละเอียด
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination basePath="/debtor/cases" params={{}} page={page} pageSize={pageSize} total={total} />
      </section>
    </DebtorShell>
  );
}
