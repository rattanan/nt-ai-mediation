import Link from "next/link";
import { requestDebtorAppointmentReschedule } from "@/app/debtor/cases/[id]/appointments/actions";
import { AppointmentDetail } from "@/components/appointments/appointment-detail";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getAppointmentDetail } from "@/lib/appointments";

export const dynamic = "force-dynamic";

export default async function DebtorAppointmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; appointmentId: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const debtor = await requireRole("debtor");
  const { id, appointmentId } = await params;
  const { success, error } = await searchParams;
  const appointment = await getAppointmentDetail(appointmentId);

  return (
    <DebtorShell profile={debtor} activePath="/debtor" title="รายละเอียดนัดหมาย" subtitle="ตรวจสอบสถานะการยืนยันและลิงก์ประชุมออนไลน์">
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      <AppointmentDetail
        appointment={appointment}
        actions={
          <div className="grid gap-4 lg:grid-cols-2">
            {appointment.status === "reschedule_requested" ? (
              <Button href={`/debtor/cases/${id}/appointments/new`} className="h-11 rounded-lg font-semibold">
                เลือกเวลานัดหมายใหม่
              </Button>
            ) : null}
            {appointment.status !== "completed" && appointment.status !== "cancelled" && appointment.status !== "reschedule_requested" ? (
              <form action={requestDebtorAppointmentReschedule} className="space-y-3">
                <input type="hidden" name="appointment_id" value={appointment.id} />
                <input type="hidden" name="case_id" value={id} />
                <textarea name="note" className="min-h-20 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="เหตุผลที่ต้องการขอเลื่อนนัด" />
                <Button type="submit" variant="outline" className="h-11 w-full rounded-lg font-semibold">ขอเลื่อนนัด</Button>
              </form>
            ) : null}
          </div>
        }
      />
      <Link href={`/debtor/cases/${id}`} className="mt-6 inline-block text-sm font-semibold text-[#8A6500] hover:text-[#111827]">
        กลับไปหน้าเคส
      </Link>
    </DebtorShell>
  );
}
