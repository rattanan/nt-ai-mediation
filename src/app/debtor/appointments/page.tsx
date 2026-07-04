import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/server";
import { appointmentStatusLabels, getAppointmentsForDebtor, isUpcomingAppointment } from "@/lib/appointments";

export const dynamic = "force-dynamic";

export default async function DebtorAppointmentsPage() {
  const profile = await requireRole("debtor");
  const appointments = await getAppointmentsForDebtor(profile.id);
  const upcoming = appointments.filter(isUpcomingAppointment);
  const history = appointments.filter((item) => !isUpcomingAppointment(item));

  return (
    <DebtorShell profile={profile} activePath="/debtor/appointments" title="นัดหมาย" subtitle="ดูคิวประชุมไกล่เกลี่ย ลิงก์ประชุม และสถานะการยืนยันนัดหมาย">
      <section className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">นัดหมายที่กำลังจะถึง</h2>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีนัดหมายที่กำลังจะถึง</p> : upcoming.map((appointment) => (
              <AppointmentSummaryCard
                key={appointment.id}
                appointment={appointment}
                detailHref={`/debtor/cases/${appointment.case_id}/appointments/${appointment.id}`}
              />
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">สรุปนัดหมาย</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between"><span className="text-[#6B7280]">ทั้งหมด</span><span className="font-semibold">{appointments.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-[#6B7280]">กำลังจะถึง</span><span className="font-semibold">{upcoming.length}</span></div>
            <div className="flex items-center justify-between"><span className="text-[#6B7280]">ประวัติ</span><span className="font-semibold">{history.length}</span></div>
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold">ประวัติและรายการนัดหมายทั้งหมด</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
              <tr><th className="px-5 py-3">เลขเคส</th><th className="px-5 py-3">วันเวลา</th><th className="px-5 py-3">ผู้ไกล่เกลี่ย</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">ลิงก์ประชุม</th></tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีข้อมูลนัดหมาย</td></tr>
              ) : appointments.map((appointment) => (
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
      </section>
    </DebtorShell>
  );
}
