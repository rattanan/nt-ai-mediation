import Link from "next/link";
import { CreditorShell } from "@/components/creditor/creditor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Pagination, getPage, paginateItems } from "@/components/ui/pagination";
import { requireRole } from "@/lib/auth/server";
import { caseStatusLabels } from "@/lib/cases";
import { getCreditorCases, getCreditorOfficer, getCreditorOrganization } from "@/lib/creditor";

export const dynamic = "force-dynamic";

export default async function CreditorCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireRole("creditor");
  const { page: pageParam } = await searchParams;
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);
  const cases = await getCreditorCases(organization?.id);
  const pageSize = 8;
  const { page, pageItems: pagedCases, total } = paginateItems(cases, getPage(pageParam), pageSize);

  return (
    <CreditorShell profile={profile} activePath="/creditor/cases" title="เคสขององค์กร" subtitle="ดูรายการคำขอไกล่เกลี่ยที่เชื่อมกับองค์กรเจ้าหนี้ของคุณ">
      {!organization ? <Alert variant="destructive" className="mb-5">ยังไม่ได้ลงทะเบียนองค์กรเจ้าหนี้</Alert> : null}
      <section className="rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold">รายการเคส</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{organization?.organization_name ?? "ยังไม่มีองค์กร"}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
              <tr><th className="px-5 py-3">เลขเคส</th><th className="px-5 py-3">เจ้าหนี้</th><th className="px-5 py-3">ยอดหนี้</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">อัปเดตล่าสุด</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody>
              {pagedCases.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีเคสที่เชื่อมกับองค์กรนี้</td></tr>
              ) : pagedCases.map((item) => (
                <tr key={item.id} className="border-t border-black/5">
                  <td className="px-5 py-4 font-medium">{item.case_number}</td>
                  <td className="px-5 py-4">{item.creditor_name}</td>
                  <td className="px-5 py-4">
                    <div className="space-y-1">
                      <p>{Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>
                      <p className="text-xs text-[#6B7280]">
                        รายได้ {formatMoney(item.monthly_income)} · รายจ่าย {formatMoney(item.monthly_expense)}
                      </p>
                      <p className="text-xs text-[#6B7280]">
                        ผ่อนได้ {formatMoney(item.affordable_monthly_payment)} / เดือน
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4"><Badge>{caseStatusLabels[item.status]}</Badge></td>
                  <td className="px-5 py-4 text-[#6B7280]">{new Date(item.updated_at).toLocaleDateString("th-TH")}</td>
                  <td className="px-5 py-4 text-right"><Link href={`/creditor/cases/${item.id}`} className="font-semibold text-[#8A6500]">รายละเอียด</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination basePath="/creditor/cases" params={{}} page={page} pageSize={pageSize} total={total} />
      </section>
    </CreditorShell>
  );
}

function formatMoney(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `${number.toLocaleString("th-TH")} บาท`;
}
