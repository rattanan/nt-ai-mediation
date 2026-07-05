import { CheckCircle2, ClipboardList, Clock3, FileWarning, XCircle } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChartCard, ChartGrid, DashboardLayout, DataTableCard, dashboardMoney, KpiCard, KpiGrid, StatusBadge } from "@/components/admin/dashboard/dashboard-components";
import { caseStatusLabels } from "@/lib/cases";
import { requireAdmin } from "@/lib/admin/auth";
import { getCaseDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function CasesDashboardPage() {
  const profile = await requireAdmin();
  const data = await getCaseDashboardData();

  return (
    <AdminShell profile={profile} activePath="/admin/dashboard" title="Cases Dashboard" subtitle="ภาพรวมเคสตามสถานะ ประเภทหนี้ พื้นที่ และคิวที่ต้องดำเนินการ">
      <DashboardLayout activePath="/admin/dashboard/cases" title="Cases" description="ติดตาม lifecycle ของเคส ตั้งแต่รับเรื่องจนปิดเคส พร้อมรายการที่รอ action จากทีมปฏิบัติการ">
        <KpiGrid>
          <KpiCard label="New Cases" value={data.tables.allCases.filter((item) => item.status === "submitted").length} icon={ClipboardList} />
          <KpiCard label="In Progress Cases" value={data.kpis.activeCases} icon={Clock3} />
          <KpiCard label="Settlement Reached" value={data.kpis.successfulCases} icon={CheckCircle2} />
          <KpiCard label="Settlement Failed" value={data.kpis.failedCases} icon={XCircle} />
          <KpiCard label="Closed Cases" value={data.tables.allCases.filter((item) => item.status === "closed").length} icon={FileWarning} />
        </KpiGrid>

        <ChartGrid>
          <ChartCard title="Case Status Distribution" items={data.charts.statusCounts.slice(0, 8)} />
          <ChartCard title="Case by Debt Type" items={data.charts.debtByType.slice(0, 8)} format={(value) => dashboardMoney(value)} />
          <ChartCard title="Case by Province" items={data.charts.provinceCounts.slice(0, 8)} />
          <ChartCard title="Monthly Case Volume" items={data.charts.monthlyCases} />
        </ChartGrid>

        <section className="grid gap-6 xl:grid-cols-2">
          <DataTableCard title="Latest Cases" columns={["เลขเคส", "เจ้าหนี้", "สถานะ", "ยอดหนี้"]} rows={data.tables.recentCases.map((item) => [item.case_number, item.creditor_name, <StatusBadge key={item.id} status={item.status} />, dashboardMoney(item.debt_amount)])} />
          <DataTableCard title="Cases Waiting for Mediator" columns={["เลขเคส", "ประเภทหนี้", "จังหวัด", "สถานะ"]} rows={data.waitingForMediator.slice(0, 8).map((item) => [item.case_number, item.debt_type, item.province, <StatusBadge key={item.id} status={item.status} />])} />
          <DataTableCard title="Cases Waiting for Appointment" columns={["เลขเคส", "เจ้าหนี้", "สถานะ", "อัปเดต"]} rows={data.waitingForAppointment.slice(0, 8).map((item) => [item.case_number, item.creditor_name, caseStatusLabels[item.status], new Date(item.updated_at).toLocaleDateString("th-TH")])} />
          <DataTableCard title="Cases Waiting for Settlement Summary" columns={["เลขเคส", "เจ้าหนี้", "ยอดหนี้", "อัปเดต"]} rows={data.waitingForSettlement.slice(0, 8).map((item) => [item.case_number, item.creditor_name, dashboardMoney(item.debt_amount), new Date(item.updated_at).toLocaleDateString("th-TH")])} />
        </section>
      </DashboardLayout>
    </AdminShell>
  );
}
