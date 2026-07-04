import Link from "next/link";
import { CalendarCheck2, ClipboardCheck, Gavel } from "lucide-react";
import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalShell } from "@/components/portal-shell";
import { getAppointmentsForMediator, isUpcomingAppointment } from "@/lib/appointments";
import { requireRole } from "@/lib/auth/server";
import { getAssignedMediatorCases, mediatorSidebar } from "@/lib/mediator-portal";
import { getMediatorProfileByUser } from "@/lib/mediators";

export const dynamic = "force-dynamic";

export default async function MediatorAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const authProfile = await requireRole("mediator");
  const { success, error } = await searchParams;
  const mediatorProfile = await getMediatorProfileByUser(authProfile.id);

  if (!mediatorProfile || mediatorProfile.status !== "approved") {
    return (
      <PortalShell
        roleLabel="Mediator Portal"
        title="นัดหมาย"
        subtitle="โปรไฟล์ต้องได้รับอนุมัติก่อนจัดการนัดหมาย"
        userName={authProfile.full_name}
        sidebarItems={mediatorSidebar("/mediator/appointments")}
        metrics={[]}
        table={{ title: "", description: "", columns: [], actionLabel: "" }}
      >
        <Alert variant="destructive">โปรไฟล์ผู้ไกล่เกลี่ยยังไม่พร้อมใช้งาน กรุณากรอกหรือส่งตรวจสอบโปรไฟล์ก่อน</Alert>
        <Button href="/mediator/profile" className="mt-5 rounded-lg font-semibold">ไปที่โปรไฟล์</Button>
      </PortalShell>
    );
  }

  const appointments = await getAppointmentsForMediator(mediatorProfile.id);
  const assignedCases = await getAssignedMediatorCases(mediatorProfile.id);
  const pendingAppointments = appointments.filter((appointment) => appointment.status === "pending_confirmation" && !appointment.confirmed_by_mediator_at);
  const upcomingAppointments = appointments.filter(isUpcomingAppointment);

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="นัดหมาย"
      subtitle="ยืนยันนัดหมาย ติดตามคิวประชุม และดูเคสที่ได้รับมอบหมาย"
      userName={authProfile.full_name}
      sidebarItems={mediatorSidebar("/mediator/appointments")}
      metrics={[
        { label: "นัดหมายรอยืนยัน", value: String(pendingAppointments.length), caption: "รอคุณยืนยันหรือขอเลื่อน", icon: ClipboardCheck },
        { label: "นัดหมายที่กำลังจะถึง", value: String(upcomingAppointments.length), caption: "นัดที่ยังไม่จบหรือยังไม่ยกเลิก", icon: CalendarCheck2 },
        { label: "เคสที่ได้รับมอบหมาย", value: String(assignedCases.length), caption: "เคสที่เลือกคุณเป็นผู้ไกล่เกลี่ย", icon: Gavel },
      ]}
      table={{ title: "", description: "", columns: [], actionLabel: "" }}
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="space-y-5">
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">นัดหมายรอยืนยัน</h2>
            <div className="mt-4 space-y-3">
              {pendingAppointments.length === 0 ? <p className="text-sm text-[#6B7280]">ไม่มีนัดหมายรอยืนยัน</p> : pendingAppointments.map((appointment) => (
                <AppointmentSummaryCard key={appointment.id} appointment={appointment} detailHref={`/mediator/appointments/${appointment.id}`} />
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">นัดหมายที่กำลังจะถึง</h2>
            <div className="mt-4 space-y-3">
              {upcomingAppointments.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีนัดหมายที่กำลังจะถึง</p> : upcomingAppointments.map((appointment) => (
                <Link key={appointment.id} href={`/mediator/appointments/${appointment.id}`} className="block rounded-lg bg-[#F8FAFC] p-3 hover:bg-[#FFF8D9]">
                  <p className="font-medium">เคส {appointment.cases?.case_number ?? "-"}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">{appointment.appointment_date} {appointment.start_time.slice(0, 5)}-{appointment.end_time.slice(0, 5)}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">เคสที่ได้รับมอบหมาย</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-black/5 text-xs uppercase text-[#6B7280]">
                <tr>
                  <th className="px-3 py-3">เลขเคส</th>
                  <th className="px-3 py-3">เจ้าหนี้</th>
                  <th className="px-3 py-3">ยอดหนี้</th>
                  <th className="px-3 py-3">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {assignedCases.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-10 text-center text-[#6B7280]">ยังไม่มีเคสที่ได้รับมอบหมาย</td>
                  </tr>
                ) : assignedCases.map((caseItem) => (
                  <tr key={caseItem.id} className="border-b border-black/5 last:border-0">
                    <td className="px-3 py-3 font-medium">{caseItem.case_number}</td>
                    <td className="px-3 py-3 text-[#6B7280]">{caseItem.creditor_name}</td>
                    <td className="px-3 py-3">{Number(caseItem.debt_amount).toLocaleString("th-TH")} บาท</td>
                    <td className="px-3 py-3"><Badge>{caseItem.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </PortalShell>
  );
}
