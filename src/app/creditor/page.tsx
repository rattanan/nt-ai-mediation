import Link from "next/link";
import { BadgeCheck, ClipboardList, FileCheck, FolderOpen, Landmark } from "lucide-react";
import { CreditorShell } from "@/components/creditor/creditor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import {
  creditorOrganizationStatusLabels,
  getCreditorCases,
  getCreditorOfficer,
  getCreditorOrganization,
} from "@/lib/creditor";
import { caseStatusLabels } from "@/lib/cases";

export const dynamic = "force-dynamic";

function Summary({ label, value, icon: Icon }: { label: string; value: number | string; icon: typeof ClipboardList }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2A8]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export default async function CreditorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const profile = await requireRole("creditor");
  const { success, error } = await searchParams;
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);
  const cases = await getCreditorCases(organization?.id);
  const pending = cases.filter((item) => item.status === "submitted" || item.status === "reviewing").length;
  const active = cases.filter((item) => ["matched", "scheduled", "in_mediation"].includes(item.status)).length;
  const approvalQueue = cases.filter((item) => item.status === "settled").length;
  const closed = cases.filter((item) => item.status === "closed" || item.status === "not_settled").length;

  return (
    <CreditorShell
      profile={profile}
      activePath="/creditor"
      title="แดชบอร์ดเจ้าหนี้"
      subtitle="ติดตามคำขอไกล่เกลี่ยและตอบกลับเคสที่เชื่อมกับองค์กรของคุณ"
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      {!organization ? (
        <section className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">ยังไม่ได้ลงทะเบียนองค์กรเจ้าหนี้</h2>
          <p className="mt-2 text-sm text-[#6B7280]">กรุณาส่งข้อมูลองค์กรเพื่อให้ผู้ดูแลระบบตรวจสอบและอนุมัติ</p>
          <Button href="/creditor/organization" className="mt-5 rounded-lg font-semibold">
            ลงทะเบียนองค์กร
          </Button>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Summary label="สถานะองค์กร" value={creditorOrganizationStatusLabels[organization.status]} icon={Landmark} />
            <Summary label="คำขอรอพิจารณา" value={pending} icon={ClipboardList} />
            <Summary label="เคสกำลังดำเนินการ" value={active} icon={FolderOpen} />
            <Summary label="รออนุมัติ settlement" value={approvalQueue} icon={BadgeCheck} />
            <Summary label="เคสปิดแล้ว" value={closed} icon={FileCheck} />
          </section>

          <section className="mt-6 rounded-lg border border-black/5 bg-white shadow-sm">
            <div className="border-b border-black/5 px-5 py-4">
              <h2 className="text-lg font-semibold">รายการเคสขององค์กร</h2>
              <p className="mt-1 text-sm text-[#6B7280]">ดูรายละเอียดและส่งคำตอบกลับในแต่ละคำขอ</p>
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
                  {cases.length === 0 ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีเคสที่เชื่อมกับองค์กรนี้</td></tr>
                  ) : cases.map((item) => (
                    <tr key={item.id} className="border-t border-black/5">
                      <td className="px-5 py-4 font-medium">{item.case_number}</td>
                      <td className="px-5 py-4">{item.creditor_name}</td>
                      <td className="px-5 py-4">{Number(item.debt_amount).toLocaleString("th-TH")} บาท</td>
                      <td className="px-5 py-4"><Badge>{caseStatusLabels[item.status]}</Badge></td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/creditor/cases/${item.id}`} className="font-semibold text-[#8A6500] hover:text-[#111827]">รายละเอียด</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </CreditorShell>
  );
}
