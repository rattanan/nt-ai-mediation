import Link from "next/link";
import { Building2, CheckCircle2, Link2, ShieldAlert, Users } from "lucide-react";
import { linkCaseToCreditorOrganization, updateCreditorOrganizationStatus } from "@/app/admin/creditors/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPage, paginateItems, Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/lib/admin/auth";
import { creditorOrganizationStatusLabels, listCreditorOfficers, listCreditorOrganizations } from "@/lib/creditor";
import type { CreditorOrganizationStatus } from "@/types/database";

export const dynamic = "force-dynamic";

const statusActions: Array<{ status: CreditorOrganizationStatus; label: string }> = [
  { status: "approved", label: "อนุมัติ" },
  { status: "rejected", label: "ปฏิเสธ" },
  { status: "suspended", label: "ระงับ" },
  { status: "pending", label: "กลับไปรอตรวจสอบ" },
];

export default async function AdminCreditorsPage({
  searchParams,
}: {
  searchParams: Promise<{ orgId?: string; page?: string; success?: string; error?: string }>;
}) {
  const profile = await requireAdmin();
  const { orgId, page: pageParam, success, error } = await searchParams;
  const organizations = await listCreditorOrganizations();
  const pageSize = 10;
  const { page, pageItems: pagedOrganizations } = paginateItems(organizations, getPage(pageParam), pageSize);
  const selectedOrganization = organizations.find((org) => org.id === orgId) ?? organizations[0] ?? null;
  const officers = selectedOrganization ? await listCreditorOfficers(selectedOrganization.id) : [];

  const statusCounts = organizations.reduce<Record<CreditorOrganizationStatus, number>>(
    (acc, org) => {
      acc[org.status] += 1;
      return acc;
    },
    { pending: 0, approved: 0, rejected: 0, suspended: 0 },
  );

  return (
    <AdminShell
      profile={profile}
      activePath="/admin/creditors"
      title="Creditor Management"
      subtitle="ตรวจสอบ อนุมัติ และเชื่อมองค์กรเจ้าหนี้กับเคสไกล่เกลี่ย"
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard label="องค์กรทั้งหมด" value={organizations.length} icon={Building2} />
        <SummaryCard label="รออนุมัติ" value={statusCounts.pending} icon={ShieldAlert} />
        <SummaryCard label="อนุมัติแล้ว" value={statusCounts.approved} icon={CheckCircle2} />
        <SummaryCard label="เจ้าหน้าที่องค์กร" value={officers.length} icon={Users} />
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_25rem]">
        <section className="rounded-lg border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4">
            <h2 className="text-lg font-semibold">รายการองค์กรเจ้าหนี้</h2>
            <p className="mt-1 text-sm text-[#6B7280]">องค์กรที่สมัครเข้าร่วมแพลตฟอร์มและรอการตรวจสอบจากผู้ดูแลระบบ</p>
          </div>

          <div className="divide-y divide-black/5">
            {organizations.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#6B7280]">ยังไม่มีองค์กรเจ้าหนี้</div>
            ) : (
              pagedOrganizations.map((organization) => (
                <article key={organization.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/admin/creditors?${new URLSearchParams({ orgId: organization.id, ...(page > 1 ? { page: String(page) } : {}) }).toString()}`} className="font-semibold hover:underline">
                        {organization.organization_name}
                      </Link>
                      <Badge>{creditorOrganizationStatusLabels[organization.status]}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {organization.organization_type}
                      {organization.tax_id ? ` · เลขผู้เสียภาษี ${organization.tax_id}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {organization.contact_email || "ไม่มีอีเมล"} · {organization.contact_phone || "ไม่มีเบอร์โทร"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {statusActions.map((action) => (
                      <form key={action.status} action={updateCreditorOrganizationStatus}>
                        <input type="hidden" name="organization_id" value={organization.id} />
                        <input type="hidden" name="status" value={action.status} />
                        <Button
                          type="submit"
                          variant={action.status === "approved" ? "default" : "outline"}
                          className="h-9 rounded-lg px-3 text-xs"
                          disabled={organization.status === action.status}
                        >
                          {action.label}
                        </Button>
                      </form>
                    ))}
                  </div>
                </article>
              ))
            )}
          </div>
          <Pagination basePath="/admin/creditors" params={{ orgId, page }} page={page} pageSize={pageSize} total={organizations.length} />
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">รายละเอียดองค์กร</h2>
            {selectedOrganization ? (
              <div className="mt-4 space-y-3 text-sm">
                <p className="font-semibold">{selectedOrganization.organization_name}</p>
                <p className="text-[#6B7280]">{selectedOrganization.address || "ยังไม่มีที่อยู่"}</p>
                <Badge>{creditorOrganizationStatusLabels[selectedOrganization.status]}</Badge>
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#6B7280]">เลือกองค์กรเพื่อดูรายละเอียด</p>
            )}
          </section>

          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">เจ้าหน้าที่ในองค์กร</h2>
            <div className="mt-4 space-y-3">
              {officers.length === 0 ? (
                <p className="text-sm text-[#6B7280]">ยังไม่มีเจ้าหน้าที่</p>
              ) : (
                officers.map((officer) => (
                  <div key={officer.id} className="rounded-lg bg-[#F8FAFC] p-3">
                    <p className="text-sm font-semibold">{officer.first_name} {officer.last_name}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">{officer.email || "ไม่มีอีเมล"} · {officer.role}</p>
                    <Badge className="mt-2">{officer.status}</Badge>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Link2 className="h-4 w-4 text-[#A87900]" aria-hidden="true" />
              <h2 className="font-semibold">เชื่อมเคสกับองค์กร</h2>
            </div>
            {selectedOrganization ? (
              <form action={linkCaseToCreditorOrganization} className="mt-4 space-y-3">
                <input type="hidden" name="organization_id" value={selectedOrganization.id} />
                <Input name="case_number" placeholder="เลขเคส เช่น MED-20260703-0001" required />
                <Button type="submit" className="h-11 w-full rounded-lg font-semibold">
                  เชื่อมเคส
                </Button>
              </form>
            ) : (
              <p className="mt-4 text-sm text-[#6B7280]">ต้องมีองค์กรก่อนจึงจะเชื่อมเคสได้</p>
            )}
          </section>
        </aside>
      </div>
    </AdminShell>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
}) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <span className="rounded-lg bg-[#FFF7D1] p-2 text-[#A87900]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold">{value.toLocaleString("th-TH")}</p>
    </div>
  );
}
