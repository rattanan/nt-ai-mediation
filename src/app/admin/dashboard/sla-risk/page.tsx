import { AlertTriangle, Clock3, FileWarning, Gauge, Timer } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChartCard, ChartGrid, DashboardLayout, DataTableCard, dashboardMoney, KpiCard, KpiGrid, StatusBadge } from "@/components/admin/dashboard/dashboard-components";
import { requireAdmin } from "@/lib/admin/auth";
import { getSlaRiskDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function SlaRiskDashboardPage() {
  const profile = await requireAdmin();
  const data = await getSlaRiskDashboardData();
  const criticalCases = data.highRiskCases.filter((item) => item.debt_amount >= 1000000 || item.overdue_months >= 18);

  return (
    <AdminShell profile={profile} activePath="/admin/dashboard" title="SLA & Risk Dashboard" subtitle="ติดตาม SLA aging ความเสี่ยง และเคสที่ต้องการ action จากผู้ดูแล">
      <DashboardLayout activePath="/admin/dashboard/sla-risk" title="SLA & Risk" description="หน้าเดียวสำหรับทีม operation ในการจัดลำดับความสำคัญของเคสที่ใกล้ breach หรือมีความเสี่ยงสูง">
        <KpiGrid>
          <KpiCard label="Cases Near SLA Breach" value={data.nearBreachCases.length} icon={Timer} />
          <KpiCard label="Overdue Cases" value={data.overdueCases.length} icon={Clock3} />
          <KpiCard label="High Risk Cases" value={data.highRiskCases.length} icon={AlertTriangle} />
          <KpiCard label="Critical Priority Cases" value={criticalCases.length} icon={FileWarning} />
          <KpiCard label="Average Case Age" value={`${data.averageCaseAge} วัน`} icon={Gauge} />
        </KpiGrid>

        <ChartGrid>
          <ChartCard title="Aging Report" items={data.charts.aging} />
          <ChartCard title="Risk Level Distribution" items={[{ label: "High Risk", value: data.highRiskCases.length }, { label: "Near SLA", value: data.nearBreachCases.length }, { label: "Overdue", value: data.overdueCases.length }]} />
          <ChartCard title="SLA Breach Trend" items={data.charts.monthlyCases} />
          <ChartCard title="Case Priority Distribution" items={data.priorityDistribution} />
        </ChartGrid>

        <section className="grid gap-6 xl:grid-cols-2">
          <DataTableCard title="Cases Near SLA Breach" columns={["เลขเคส", "สถานะ", "ยอดหนี้", "อัปเดต"]} rows={data.nearBreachCases.slice(0, 8).map((item) => [item.case_number, <StatusBadge key={item.id} status={item.status} />, dashboardMoney(item.debt_amount), new Date(item.updated_at).toLocaleDateString("th-TH")])} />
          <DataTableCard title="Overdue Cases" columns={["เลขเคส", "สถานะ", "จังหวัด", "อัปเดต"]} rows={data.overdueCases.slice(0, 8).map((item) => [item.case_number, <StatusBadge key={item.id} status={item.status} />, item.province, new Date(item.updated_at).toLocaleDateString("th-TH")])} />
          <DataTableCard title="High Risk Cases" columns={["เลขเคส", "ประเภทหนี้", "ค้างชำระ", "ยอดหนี้"]} rows={data.highRiskCases.slice(0, 8).map((item) => [item.case_number, item.debt_type, `${item.overdue_months} เดือน`, dashboardMoney(item.debt_amount)])} />
          <DataTableCard title="Cases Requiring Admin Action" columns={["เลขเคส", "เจ้าหนี้", "สถานะ"]} rows={data.tables.allCases.filter((item) => ["submitted", "needs_more_info", "admin_review"].includes(item.status)).slice(0, 8).map((item) => [item.case_number, item.creditor_name, <StatusBadge key={item.id} status={item.status} />])} />
        </section>
      </DashboardLayout>
    </AdminShell>
  );
}
