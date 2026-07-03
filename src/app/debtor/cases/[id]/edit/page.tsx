import { updateCase } from "@/app/debtor/cases/actions";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { CaseForm } from "@/components/debtor/case-form";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor, isEditableCase } from "@/lib/cases";

export const dynamic = "force-dynamic";

export default async function EditCasePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireRole("debtor");
  const { id } = await params;
  const { error } = await searchParams;
  const item = await getCaseForDebtor(id, profile.id);
  const action = updateCase.bind(null, item.id);

  return (
    <DebtorShell
      profile={profile}
      activePath="/debtor"
      title={`แก้ไขคำขอ ${item.case_number}`}
      subtitle="แก้ไขได้เฉพาะแบบร่างหรือคำขอที่ระบบขอข้อมูลเพิ่มเติม"
    >
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      {!isEditableCase(item.status) ? (
        <Alert variant="destructive">คำขอนี้ไม่สามารถแก้ไขได้แล้ว เพราะเข้าสู่กระบวนการตรวจสอบแล้ว</Alert>
      ) : (
        <CaseForm action={action} submitLabel="บันทึกการแก้ไข" defaultCase={item} />
      )}
    </DebtorShell>
  );
}
