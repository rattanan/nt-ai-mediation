import Link from "next/link";
import { BadgeCheck, ClipboardList, FileCheck, FolderOpen, Landmark } from "lucide-react";
import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { CreditorShell } from "@/components/creditor/creditor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getAppointmentsForCreditorOrganization, isUpcomingAppointment } from "@/lib/appointments";
import {
  creditorOrganizationStatusLabels,
  getCreditorCases,
  getCreditorOfficer,
  getCreditorOrganization,
} from "@/lib/creditor";
import { caseStatusLabels } from "@/lib/cases";
import { listCreditorInvoices, money } from "@/lib/closing";

export const dynamic = "force-dynamic";

function Summary({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof ClipboardList }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2A8]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default async function CreditorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const profile = await requireRole("creditor");
  const { success, error } = await searchParams;
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);
  const cases = await getCreditorCases(organization?.id);
  const appointments = await getAppointmentsForCreditorOrganization(organization?.id);
  const invoices = await listCreditorInvoices(organization?.id);
  const pendingAppointments = appointments.filter((item) => item.status === "pending_confirmation" && !item.confirmed_by_creditor_at);
  const upcomingAppointments = appointments.filter(isUpcomingAppointment).slice(0, 3);
  const pending = cases.filter((item) => item.status === "creditor_review").length;
  const active = cases.filter((item) => ["creditor_accepted", "mediator_matching", "matched", "scheduled", "in_mediation"].includes(item.status)).length;
  const approvalQueue = cases.filter((item) => item.status === "settled").length;
  const closed = cases.filter((item) => item.status === "closed" || item.status === "not_settled").length;
  const totalDebt = cases.reduce((sum, item) => sum + Number(item.debt_amount), 0);
  const settledDebt = invoices.reduce((sum, item) => sum + Number(item.settled_amount ?? 0), 0);
  const invoiceFees = invoices.reduce((sum, item) => sum + Number(item.total_amount ?? 0), 0);
  const recoveryRate = totalDebt > 0 ? Math.round((settledDebt / totalDebt) * 100) : 0;

  return (
    <CreditorShell
      profile={profile}
      activePath="/creditor"
      title="แดชบอร์ดเจ้าหนี้"
      subtitle="ติดตามคำขอไกล่เกลี่ยและตอบกลับเคสที่เชื่อมกับองค์กรของคุณ"
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      {!organization ? (
        <section className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">ยังไม่ได้ลงทะเบียนองค์กรเจ้าหนี้</h2>
          <p className="mt-2 text-sm text-[#6B7280]">กรุณาส่งข้อมูลองค์กรเพื่อให้ผู้ดูแลระบบตรวจสอบและอนุมัติ</p>
          <Button href="/creditor/organization" className="mt-5 rounded-lg font-semibold">
            ลงทะเบียนองค์กร
          </Button>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Summary label="สถานะองค์กร" value={creditorOrganizationStatusLabels[organization.status]} icon={Landmark} />
            <Summary label="คำขอรอพิจารณา" value={pending} icon={ClipboardList} />
            <Summary label="เคสกำลังดำเนินการ" value={active} icon={FolderOpen} />
            <Summary label="รออนุมัติ settlement" value={approvalQueue} icon={BadgeCheck} />
            <Summary label="เคสปิดแล้ว" value={closed} icon={FileCheck} />
            <Summary label="มูลหนี้รวม" value={money(totalDebt)} icon={ClipboardList} />
            <Summary label="มูลหนี้ที่ตกลงได้" value={money(settledDebt)} icon={BadgeCheck} />
            <Summary label="Recovery Rate" value={`${recoveryRate}%`} icon={BadgeCheck} />
            <Summary label="ค่าธรรมเนียมที่ต้องชำระ" value={money(invoiceFees)} icon={FileCheck} />
            <Summary label="ใบแจ้งหนี้" value={invoices.length} icon={FileCheck} />
          </section>

          {pendingAppointments.length > 0 || upcomingAppointments.length > 0 ? (
            <section className="mt-6 grid gap-4 xl:grid-cols-2">
              <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold">คิวรอยืนยันนัดหมาย</h2>
                <div className="mt-4 space-y-3">
                  {pendingAppointments.length === 0 ? <p className="text-sm text-[#6B7280]">ไม่มีนัดหมายรอยืนยัน</p> : pendingAppointments.map((appointment) => (
                    <Link key={appointment.id} href={`/creditor/cases/${appointment.case_id}`} className="block rounded-lg bg-[#F8FAFC] p-3 hover:bg-[#FFF8D9]">
                      <p className="font-medium">เคส {appointment.cases?.case_number ?? "-"}</p>
                      <p className="mt-1 text-sm text-[#6B7280]">{appointment.appointment_date} {appointment.start_time.slice(0, 5)}</p>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                {upcomingAppointments.map((appointment) => (
                  <AppointmentSummaryCard key={appointment.id} appointment={appointment} detailHref={`/creditor/cases/${appointment.case_id}`} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6 rounded-lg border border-black/5 bg-white shadow-sm">
            <div className="border-b border-black/5 px-5 py-4">
              <h2 className="text-lg font-semibold">รายการเคสขององค์กร</h2>
              <p className="mt-1 text-sm text-[#6B7280]">ดูรายละเอียดและส่งคำตอบกลับในแต่ละคำขอ</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
                  <tr>
                    <th className="px-5 py-3">เลขเคส</th>
                    <th className="px-5 py-3">เจ้าหนี้</th>
                    <th className="px-5 py-3">ยอดหนี้</th>
                    <th className="px-5 py-3">สถานะ</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {cases.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีเคสที่เชื่อมกับองค์กรนี้</td></tr>
                  ) : cases.map((item) => (
                    <tr key={item.id} className="border-t border-black/5">
                      <td className="px-5 py-4 font-medium">{item.case_number}</td>
                      <td className="px-5 py-4">{item.creditor_name}</td>
                      <td className="px-5 py-4">{Number(item.debt_amount).toLocaleString("th-TH")} บาท</td>
                      <td className="px-5 py-4"><Badge>{caseStatusLabels[item.status]}</Badge></td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/creditor/cases/${item.id}`} className="font-semibold text-[#8A6500] hover:text-[#111827]">รายละเอียด</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </CreditorShell>
  );
}
