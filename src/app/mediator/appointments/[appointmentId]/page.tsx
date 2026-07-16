import Link from "next/link";
import {
  confirmMediatorAppointment,
  createMediatorGoogleMeet,
  markAppointmentOutcome,
  requestMediatorReschedule,
  updateAppointmentMeetingUrl,
} from "@/app/mediator/actions";
import { AppointmentDetail } from "@/components/appointments/appointment-detail";
import { PortalShell } from "@/components/portal-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getAppointmentDetail } from "@/lib/appointments";
import { mediatorSidebar } from "@/lib/mediator-portal";

export const dynamic = "force-dynamic";

export default async function MediatorAppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ appointmentId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const profile = await requireRole("mediator");
  const { appointmentId } = await params;
  const { success, error } = await searchParams;
  const appointment = await getAppointmentDetail(appointmentId);

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="รายละเอียดนัดหมาย"
      subtitle="ยืนยันนัดหมาย เพิ่มลิงก์ประชุม และบันทึกผลการไกล่เกลี่ย"
      userName={profile.full_name}
      sidebarItems={mediatorSidebar("/mediator/appointments")}
      metrics={[]}
      table={{ title: "", description: "", columns: [], actionLabel: "" }}
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <AppointmentDetail
        appointment={appointment}
        actions={
          <div className="grid gap-4 lg:grid-cols-2">
            {["online", "hybrid"].includes(appointment.meeting_type) && !["cancelled", "completed"].includes(appointment.status) ? <form action={createMediatorGoogleMeet} className="space-y-3"><input type="hidden" name="appointment_id" value={appointment.id}/><input type="hidden" name="case_id" value={appointment.case_id}/><p className="text-sm text-[#6B7280]">ระบบจะส่ง Calendar invite ให้ผู้เข้าร่วมทุกฝ่าย</p><Button type="submit" className="h-11 w-full rounded-lg font-semibold" disabled={appointment.google_sync_status === "creating"}>{appointment.meeting_url ? "Google Meet พร้อมใช้งาน" : "สร้าง Google Meet"}</Button></form> : null}
            {!appointment.confirmed_by_mediator_at && appointment.status !== "cancelled" ? (
              <form action={confirmMediatorAppointment} className="space-y-3">
                <input type="hidden" name="appointment_id" value={appointment.id} />
                <input type="hidden" name="case_id" value={appointment.case_id} />
                <textarea name="note" className="min-h-20 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="หมายเหตุการยืนยัน" />
                <Button type="submit" className="h-11 w-full rounded-lg font-semibold">ยืนยันนัดหมาย</Button>
              </form>
            ) : null}

            <form action={updateAppointmentMeetingUrl} className="space-y-3">
              <input type="hidden" name="appointment_id" value={appointment.id} />
              <input type="hidden" name="case_id" value={appointment.case_id} />
              <input name="meeting_url" type="url" defaultValue={appointment.meeting_url ?? ""} className="h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" placeholder="https://meet.google.com/..." />
              <Button type="submit" variant="outline" className="h-11 w-full rounded-lg font-semibold">บันทึก Meeting URL</Button>
            </form>

            {appointment.status !== "completed" && appointment.status !== "cancelled" ? (
              <form action={requestMediatorReschedule} className="space-y-3">
                <input type="hidden" name="appointment_id" value={appointment.id} />
                <input type="hidden" name="case_id" value={appointment.case_id} />
                <textarea name="note" className="min-h-20 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="เหตุผลที่ต้องการขอเลื่อนนัด" />
                <Button type="submit" variant="outline" className="h-11 w-full rounded-lg font-semibold">ขอเลื่อนนัด</Button>
              </form>
            ) : null}

            {appointment.status === "confirmed" ? (
              <form action={markAppointmentOutcome} className="space-y-3">
                <input type="hidden" name="appointment_id" value={appointment.id} />
                <input type="hidden" name="case_id" value={appointment.case_id} />
                <textarea name="note" className="min-h-20 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="หมายเหตุผลการนัดหมาย" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="submit" name="status" value="completed" className="h-11 rounded-lg font-semibold">เสร็จสิ้น</Button>
                  <Button type="submit" name="status" value="no_show" variant="outline" className="h-11 rounded-lg font-semibold">ไม่มาตามนัด</Button>
                </div>
              </form>
            ) : null}
            {appointment.status === "completed" ? (
              <div className="grid gap-2"><Button href={`/staff/appointments/${appointment.id}/minutes`} variant="outline" className="h-11 rounded-lg font-semibold">ตรวจ transcript / บันทึกการประชุม</Button><Button href={`/mediator/closing/${appointment.case_id}?appointment=${appointment.id}`} className="h-11 rounded-lg font-semibold">ปิดเคสและสร้างเอกสาร</Button></div>
            ) : null}
          </div>
        }
      />

      <Link href="/mediator/appointments" className="mt-6 inline-block text-sm font-semibold text-[#8A6500] hover:text-[#111827]">
        กลับหน้านัดหมาย
      </Link>
      <Link href={`/mediator/cases/${appointment.case_id}`} className="mt-2 inline-block text-sm font-semibold text-[#8A6500] hover:text-[#111827]">
        ไปยังรายละเอียดเคส
      </Link>
    </PortalShell>
  );
}
