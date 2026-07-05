import Link from "next/link";
import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { CreditorShell } from "@/components/creditor/creditor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Pagination, getPage, paginateItems } from "@/components/ui/pagination";
import { requireRole } from "@/lib/auth/server";
import { appointmentStatusLabels, getAppointmentsForCreditorOrganization, isUpcomingAppointment } from "@/lib/appointments";
import { getCreditorOfficer, getCreditorOrganization } from "@/lib/creditor";

export const dynamic = "force-dynamic";

export default async function CreditorAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireRole("creditor");
  const { page: pageParam } = await searchParams;
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);
  const appointments = await getAppointmentsForCreditorOrganization(organization?.id);
  const pageSize = 8;
  const { page, pageItems: pagedAppointments, total } = paginateItems(appointments, getPage(pageParam), pageSize);
  const pending = appointments.filter((item) => item.status === "pending_confirmation" && !item.confirmed_by_creditor_at);
  const upcoming = appointments.filter(isUpcomingAppointment);

  return (
    <CreditorShell profile={profile} activePath="/creditor/appointments" title="นัดหมาย" subtitle="ยืนยันและติดตามนัดหมายไกล่เกลี่ยขององค์กร">
      {!organization ? <Alert variant="destructive" className="mb-5">ยังไม่ได้ลงทะเบียนองค์กรเจ้าหนี้</Alert> : null}
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">นัดหมายรอยืนยัน</h2>
          <div className="mt-4 space-y-3">
            {pending.length === 0 ? <p className="text-sm text-[#6B7280]">ไม่มีนัดหมายรอยืนยัน</p> : pending.map((appointment) => (
              <AppointmentSummaryCard key={appointment.id} appointment={appointment} detailHref={`/creditor/cases/${appointment.case_id}`} />
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">นัดหมายที่กำลังจะถึง</h2>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีนัดหมายที่กำลังจะถึง</p> : upcoming.map((appointment) => (
              <Link key={appointment.id} href={`/creditor/cases/${appointment.case_id}`} className="block rounded-lg bg-[#F8FAFC] p-3 hover:bg-[#FFF8D9]">
                <p className="font-medium">เคส {appointment.cases?.case_number ?? "-"}</p>
                <p className="mt-1 text-sm text-[#6B7280]">{appointment.appointment_date} {appointment.start_time.slice(0, 5)}-{appointment.end_time.slice(0, 5)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4"><h2 className="text-lg font-semibold">รายการนัดหมายทั้งหมด</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
              <tr><th className="px-5 py-3">เลขเคส</th><th className="px-5 py-3">วันเวลา</th><th className="px-5 py-3">ผู้ไกล่เกลี่ย</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">ลิงก์ประชุม</th></tr>
            </thead>
            <tbody>
              {pagedAppointments.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีข้อมูลนัดหมาย</td></tr>
              ) : pagedAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-t border-black/5">
                  <td className="px-5 py-4 font-medium">{appointment.cases?.case_number ?? "-"}</td>
                  <td className="px-5 py-4">{appointment.appointment_date} {appointment.start_time.slice(0, 5)}-{appointment.end_time.slice(0, 5)}</td>
                  <td className="px-5 py-4">{appointment.mediator_profiles ? `${appointment.mediator_profiles.title ?? ""} ${appointment.mediator_profiles.first_name} ${appointment.mediator_profiles.last_name}`.trim() : "-"}</td>
                  <td className="px-5 py-4"><Badge>{appointmentStatusLabels[appointment.status]}</Badge></td>
                  <td className="px-5 py-4">{appointment.meeting_url ? <a href={appointment.meeting_url} className="font-semibold text-[#8A6500]">เปิดลิงก์</a> : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination basePath="/creditor/appointments" params={{}} page={page} pageSize={pageSize} total={total} />
      </section>
    </CreditorShell>
  );
}
