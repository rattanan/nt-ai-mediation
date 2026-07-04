import { bookAppointment } from "@/app/debtor/cases/[id]/appointments/actions";
import { SlotPicker } from "@/components/appointments/slot-picker";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/server";
import { getAvailableSlotsForCase } from "@/lib/appointments";
import { caseStatusLabels, getCaseForDebtor } from "@/lib/cases";

export const dynamic = "force-dynamic";

export default async function NewAppointmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const debtor = await requireRole("debtor");
  const { id } = await params;
  const { error, success } = await searchParams;
  const item = await getCaseForDebtor(id, debtor.id);
  const slots = await getAvailableSlotsForCase(id, debtor.id);
  const action = bookAppointment.bind(null, id);

  return (
    <DebtorShell profile={debtor} activePath="/debtor" title="เลือกเวลานัดหมาย" subtitle="เลือกช่วงเวลาที่ผู้ไกล่เกลี่ยเปิดรับ จากนั้นระบบจะส่งให้เจ้าหนี้และผู้ไกล่เกลี่ยยืนยัน">
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <section className="mb-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <Badge>{caseStatusLabels[item.status]}</Badge>
        <h2 className="mt-3 text-lg font-semibold">เคส {item.case_number}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{item.creditor_name} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>
      </section>

      <SlotPicker slots={slots} action={action} />
    </DebtorShell>
  );
}
