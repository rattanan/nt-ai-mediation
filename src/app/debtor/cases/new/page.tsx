import { createCase } from "@/app/debtor/cases/actions";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { CaseForm } from "@/components/debtor/case-form";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireRole("debtor");
  const { error } = await searchParams;

  return (
    <DebtorShell
      profile={profile}
      activePath="/debtor/cases/new"
      title="สร้างคำขอไกล่เกลี่ย"
      subtitle="กรอกข้อมูลหนี้ ปัญหา และแนวทางที่ต้องการเพื่อเริ่มกระบวนการ"
    >
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      <CaseForm action={createCase} submitLabel="บันทึกแบบร่าง" />
    </DebtorShell>
  );
}
