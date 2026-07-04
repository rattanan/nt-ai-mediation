import Link from "next/link";
import { AppointmentDetail } from "@/components/appointments/appointment-detail";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Alert } from "@/components/ui/alert";
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
      <AppointmentDetail appointment={appointment} />
      <Link href={`/debtor/cases/${id}`} className="mt-6 inline-block text-sm font-semibold text-[#8A6500] hover:text-[#111827]">
        กลับไปหน้าเคส
      </Link>
    </DebtorShell>
  );
}
