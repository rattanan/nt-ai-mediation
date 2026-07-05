import { Download, Filter } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { caseStatusLabels } from "@/lib/cases";
import { money } from "@/lib/closing";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardData, type DashboardFilters } from "@/lib/admin/dashboard";
import type { CaseStatus } from "@/types/database";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-lg bg-[#F8FAFC] p-4"><p className="text-sm text-[#6B7280]">{label}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>;
}

function ReportCard({ title, items }: { title: string; items: { label: string; value: string | number }[] }) {
  return (
    <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => <Stat key={item.label} label={item.label} value={item.value} />)}
      </div>
    </section>
  );
}

function FilterSelect({ name, label, value, options }: { name: string; label: string; value?: string; options: { label: string; value: string }[] }) {
  return (
    <label className="text-sm font-medium">{label}
      <select name={name} defaultValue={value ?? ""} className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm">
        <option value="">ทั้งหมด</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<DashboardFilters>;
}) {
  const profile = await requireAdmin();
  const filters = await searchParams;
  const data = await getAdminDashboardData(filters);
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });

  return (
    <AdminShell
      profile={profile}
      activePath="/admin/reports"
      title="Reports"
      subtitle="รายงานปฏิบัติการ การเงิน และคุณภาพ พร้อมตัวกรองสำหรับผู้บริหาร"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
        <span>Admin</span><span>/</span><span className="font-semibold text-[#111827]">Reports</span>
      </div>

      <form className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2 font-semibold"><Filter className="h-4 w-4" /> Filter Bar</div>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <label className="text-sm font-medium">วันที่เริ่มต้น
            <input name="start" type="date" defaultValue={filters.start ?? ""} className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
          </label>
          <label className="text-sm font-medium">วันที่สิ้นสุด
            <input name="end" type="date" defaultValue={filters.end ?? ""} className="mt-1 h-10 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
          </label>
          <FilterSelect name="debtType" label="ประเภทหนี้" value={filters.debtType} options={data.filters.debtTypes.map((item) => ({ label: item, value: item }))} />
          <FilterSelect name="province" label="จังหวัด" value={filters.province} options={data.filters.provinces.map((item) => ({ label: item, value: item }))} />
          <FilterSelect name="creditor" label="เจ้าหนี้" value={filters.creditor} options={data.filters.creditors.map((item) => ({ label: item.organization_name, value: item.id }))} />
          <FilterSelect name="mediator" label="ผู้ไกล่เกลี่ย" value={filters.mediator} options={data.filters.mediators.map((item) => ({ label: `${item.first_name} ${item.last_name}`, value: item.id }))} />
          <FilterSelect name="status" label="สถานะเคส" value={filters.status} options={Object.entries(caseStatusLabels).map(([value, label]) => ({ value, label })) as { value: CaseStatus; label: string }[]} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" className="rounded-lg font-semibold">ใช้ตัวกรอง</Button>
          <Button href="/admin/reports" variant="outline" className="rounded-lg">ล้างตัวกรอง</Button>
          <Button href={`/admin/reports/export?${params.toString()}`} variant="outline" className="rounded-lg">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </form>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <ReportCard title="Operational Reports" items={[
          { label: "Case Volume", value: data.kpis.totalCases },
          { label: "Case Status Active", value: data.kpis.activeCases },
          { label: "SLA Risk", value: data.tables.slaCases.length },
          { label: "Aging 31+ Days", value: data.charts.aging.find((item) => item.label === "31+ วัน")?.value ?? 0 },
          { label: "Mediator Workload", value: data.tables.topMediators.reduce((sum, item) => sum + item.cases, 0) },
          { label: "Appointments", value: data.tables.appointments.length },
        ]} />
        <ReportCard title="Financial Reports" items={[
          { label: "Debt Amount", value: money(data.kpis.totalDebt) },
          { label: "Settlement Amount", value: money(data.kpis.settledDebt) },
          { label: "Platform Fee", value: money(data.kpis.platformFee) },
          { label: "Success Fee", value: money(data.kpis.successFee) },
          { label: "Revenue Summary", value: money(data.kpis.totalRevenue) },
          { label: "Creditor Invoices", value: data.tables.invoices.length },
        ]} />
        <ReportCard title="Quality Reports" items={[
          { label: "Mediator Performance", value: `${data.tables.topMediators[0]?.score ?? 0} top score` },
          { label: "Trust Score Report", value: data.tables.topMediators.length },
          { label: "Debtor Satisfaction", value: data.tables.topMediators[0]?.rating.toFixed(1) ?? "0.0" },
          { label: "Review Approval Queue", value: data.tables.pendingReviewCount },
          { label: "Complaint Report", value: data.tables.reviews.filter((item) => item.rating <= 2).length },
          { label: "Success Rate", value: `${data.kpis.successRate}%` },
        ]} />
      </section>

      <section className="mt-6 rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="font-semibold">Case Status Report</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
              <tr><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">จำนวน</th></tr>
            </thead>
            <tbody>{data.charts.statusCounts.map((item) => <tr key={item.label} className="border-t border-black/5"><td className="px-5 py-3">{caseStatusLabels[item.label as CaseStatus] ?? item.label}</td><td className="px-5 py-3 font-semibold">{item.value}</td></tr>)}</tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
