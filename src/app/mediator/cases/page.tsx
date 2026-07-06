import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Pagination, getPage, paginateItems } from "@/components/ui/pagination";
import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/lib/auth/server";
import { caseStatusLabels } from "@/lib/cases";
import { mediatorSidebar } from "@/lib/mediator-portal";
import { getMediatorProfileByUser } from "@/lib/mediators";
import { getAssignedMediatorCases } from "@/lib/mediator-portal";

export const dynamic = "force-dynamic";

export default async function MediatorCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireRole("mediator");
  const { page: pageParam } = await searchParams;
  const mediator = await getMediatorProfileByUser(profile.id);
  const cases = mediator ? await getAssignedMediatorCases(mediator.id) : [];
  const pageSize = 8;
  const { page, pageItems, total } = paginateItems(cases, getPage(pageParam), pageSize);

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="เคสที่ได้รับมอบหมาย"
      subtitle="ดูรายละเอียดคู่กรณี ข้อตกลง และไปยังขั้นตอนนัดหมายหรือปิดเคส"
      userName={profile.full_name}
      sidebarItems={mediatorSidebar("/mediator/cases")}
      metrics={[]}
      table={{ title: "", description: "", columns: [], actionLabel: "" }}
    >
      <section className="rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold">รายการเคส</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{cases.length.toLocaleString("th-TH")} เคส</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
              <tr>
                <th className="px-5 py-3">เลขเคส</th>
                <th className="px-5 py-3">เจ้าหนี้</th>
                <th className="px-5 py-3">ยอดหนี้</th>
                <th className="px-5 py-3">สถานะ</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีเคสที่ได้รับมอบหมาย</td></tr>
              ) : pageItems.map((item) => (
                <tr key={item.id} className="border-t border-black/5">
                  <td className="px-5 py-4 font-medium">{item.case_number}</td>
                  <td className="px-5 py-4">{item.creditor_name}</td>
                  <td className="px-5 py-4">{Number(item.debt_amount).toLocaleString("th-TH")} บาท</td>
                  <td className="px-5 py-4"><Badge>{caseStatusLabels[item.status]}</Badge></td>
                  <td className="px-5 py-4 text-right"><Link href={`/mediator/cases/${item.id}`} className="font-semibold text-[#8A6500]">รายละเอียด</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination basePath="/mediator/cases" params={{}} page={page} pageSize={pageSize} total={total} />
      </section>
    </PortalShell>
  );
}

