import { createCase } from "@/app/debtor/cases/actions";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { CaseForm } from "@/components/debtor/case-form";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/server";
import { listPublicCreditorOrganizations } from "@/lib/creditor";
import { CreditorOrganizationPicker } from "@/components/debtor/creditor-organization-picker";

export const dynamic = "force-dynamic";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; orgId?: string }>;
}) {
  const profile = await requireRole("debtor");
  const { error, orgId } = await searchParams;
  const organizations = await listPublicCreditorOrganizations();
  const selected = orgId ? organizations.find((organization) => organization.id === orgId) ?? null : null;

  return (
    <DebtorShell
      profile={profile}
      activePath="/debtor/cases"
      title="สร้างใบคำขอ"
      subtitle={selected ? "กรอกข้อมูลหนี้ ปัญหา และแนวทางที่ต้องการเพื่อเริ่มกระบวนการ" : "ค้นหาและเลือกองค์กรเจ้าหนี้ก่อนเริ่มสร้างใบคำขอ"}
    >
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      {selected ? (
        <>
          <section className="mb-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#F5B800]/30 bg-[#FFF8D9]">
                {selected.logo_url || selected.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.logo_url ?? selected.logo ?? ""} alt="" className="h-full w-full object-contain p-2" />
                ) : null}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#6B7280]">{selected.organization_type}</p>
                <h2 className="text-xl font-semibold">{selected.short_name || selected.organization_name}</h2>
                <p className="mt-1 text-sm text-[#6B7280]">{selected.address || "ยังไม่มีที่อยู่"}</p>
              </div>
            </div>
          </section>
          <CaseForm
            action={createCase}
            submitLabel="บันทึกแบบร่าง"
            campaignSummary={{
              organizationId: selected.id,
              campaignId: "",
              organizationName: selected.organization_name,
              campaignTitle: "ใบคำขอไกล่เกลี่ย",
              debtType: "",
            }}
          />
        </>
      ) : (
        <CreditorOrganizationPicker organizations={organizations} />
      )}
    </DebtorShell>
  );
}
