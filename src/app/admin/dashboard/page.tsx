import { Banknote, CalendarClock, CheckCircle2, ClipboardList, HandCoins, TrendingUp } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  ChartCard,
  ChartGrid,
  DashboardLayout,
  DataTableCard,
  dashboardMoney,
  formatDashboardNumber,
  KpiCard,
  KpiGrid,
  StatusBadge,
} from "@/components/admin/dashboard/dashboard-components";
import { requireAdmin } from "@/lib/admin/auth";
import { getOverviewDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();
  const data = await getOverviewDashboardData();
  const kpi = data.kpis;

  return (
    <AdminShell
      profile={profile}
      activePath="/admin/dashboard"
      title="Executive Dashboard"
      subtitle="ภาพรวมระดับผู้บริหารของ NT AI Digital Mediation Platform"
    >
      <DashboardLayout
        activePath="/admin/dashboard"
        title="Overview"
        description="สรุปเฉพาะตัวชี้วัดสำคัญสำหรับผู้บริหาร พร้อม alert และงานที่ต้องตัดสินใจวันนี้"
      >
        <KpiGrid>
          <KpiCard label="Total Cases" value={kpi.totalCases} icon={ClipboardList} />
          <KpiCard label="Active Cases" value={kpi.activeCases} icon={CalendarClock} />
          <KpiCard label="Settlement Success Rate" value={`${kpi.successRate}%`} icon={CheckCircle2} />
          <KpiCard label="Total Debt Amount" value={dashboardMoney(kpi.totalDebt)} icon={Banknote} />
          <KpiCard label="Total Settlement Amount" value={dashboardMoney(kpi.settledDebt)} icon={HandCoins} />
          <KpiCard label="Total Revenue" value={dashboardMoney(kpi.totalRevenue)} icon={TrendingUp} />
        </KpiGrid>

        <ChartGrid>
          <ChartCard title="Case Volume Trend รายเดือน" items={data.charts.monthlyCases} />
          <ChartCard
            title="Revenue Trend รายเดือน"
            items={data.charts.monthlyRevenue.map((item) => ({ label: item.label, value: item.platformFee + item.successFee }))}
            format={(value) => dashboardMoney(value)}
          />
        </ChartGrid>

        <section className="grid gap-6 xl:grid-cols-2">
          <DataTableCard
            title="Top Alerts"
            columns={["รายการ", "สถานะ", "รายละเอียด"]}
            rows={[
              ["เคสใกล้ครบ SLA", <StatusBadge key="sla" status="overdue" />, `${formatDashboardNumber(data.tables.slaCases.length)} เคสต้องติดตาม`],
              ["เคสความเสี่ยงสูง", <StatusBadge key="risk" status="overdue" />, `${formatDashboardNumber(data.tables.highRiskCases.length)} เคสหนี้สูง/ค้างชำระนาน`],
              ["รีวิวรออนุมัติ", <StatusBadge key="review" status="reviewing" />, `${formatDashboardNumber(data.tables.pendingReviewCount)} รีวิวในคิว admin`],
            ]}
          />
          <DataTableCard
            title="Today’s Action Required"
            columns={["งาน", "จำนวน", "Drill down"]}
            rows={[
              ["ตรวจเคสรอ SLA", data.tables.slaCases.length, "Dashboard > SLA & Risk"],
              ["ติดตามเคส settlement draft", data.tables.allCases.filter((item) => item.status === "settlement_draft").length, "Dashboard > Cases"],
              ["ตรวจ review คุณภาพ", data.tables.pendingReviewCount, "Dashboard > Reviews & Trust Score"],
            ]}
          />
        </section>
      </DashboardLayout>
    </AdminShell>
  );
}
