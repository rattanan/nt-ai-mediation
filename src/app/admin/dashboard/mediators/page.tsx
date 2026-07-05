import { CheckCircle2, Clock3, Star, TrendingUp, UserCheck, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChartCard, ChartGrid, DashboardLayout, DataTableCard, KpiCard, KpiGrid, StatusBadge, TrustScoreBadge } from "@/components/admin/dashboard/dashboard-components";
import { requireAdmin } from "@/lib/admin/auth";
import { getMediatorDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function MediatorsDashboardPage() {
  const profile = await requireAdmin();
  const data = await getMediatorDashboardData();

  return (
    <AdminShell profile={profile} activePath="/admin/dashboard" title="Mediator Dashboard" subtitle="ภาพรวมผู้ไกล่เกลี่ย ความพร้อม workload และคุณภาพบริการ">
      <DashboardLayout activePath="/admin/dashboard/mediators" title="Mediators" description="ติดตามจำนวนผู้ไกล่เกลี่ยที่พร้อมรับงาน งานคงค้าง trust score และ rating เพื่อบริหาร capacity">
        <KpiGrid>
          <KpiCard label="Approved Mediators" value={data.approvedMediators.length} icon={UserCheck} />
          <KpiCard label="Available Mediators" value={data.availableMediators.length} icon={Clock3} />
          <KpiCard label="Active Mediators" value={data.activeMediators.length} icon={Users} />
          <KpiCard label="Average Trust Score" value={data.averageTrustScore} icon={TrendingUp} />
          <KpiCard label="Average Rating" value={data.averageRating.toFixed(1)} icon={Star} />
          <KpiCard label="Total Completed Cases" value={data.mediatorRows.reduce((sum, item) => sum + item.completedCases, 0)} icon={CheckCircle2} />
        </KpiGrid>

        <ChartGrid>
          <ChartCard title="Mediator Workload" items={data.mediatorRows.slice(0, 8).map((item) => ({ label: item.name, value: item.activeCases }))} />
          <ChartCard title="Trust Score Distribution" items={[{ label: "85+", value: data.mediatorRows.filter((item) => item.score >= 85).length }, { label: "70-84", value: data.mediatorRows.filter((item) => item.score >= 70 && item.score < 85).length }, { label: "50-69", value: data.mediatorRows.filter((item) => item.score >= 50 && item.score < 70).length }, { label: "<50", value: data.mediatorRows.filter((item) => item.score < 50).length }]} />
          <ChartCard title="Settlement Success Rate by Mediator" items={data.mediatorRows.slice(0, 8).map((item) => ({ label: item.name, value: item.successRate }))} format={(value) => `${value}%`} />
          <ChartCard title="Mediator by Province" items={data.charts.provinceCounts.slice(0, 8)} />
        </ChartGrid>

        <section className="grid gap-6 xl:grid-cols-2">
          <DataTableCard title="Top Mediators" columns={["ชื่อ", "จังหวัด", "Trust Score", "Rating"]} rows={data.mediatorRows.sort((a, b) => b.score - a.score).slice(0, 8).map((item) => [item.name, item.province, <TrustScoreBadge key={item.id} score={item.score} />, item.rating.toFixed(1)])} />
          <DataTableCard title="Mediators with High Workload" columns={["ชื่อ", "Active Cases", "All Cases", "Success Rate"]} rows={data.mediatorRows.sort((a, b) => b.activeCases - a.activeCases).slice(0, 8).map((item) => [item.name, item.activeCases, item.cases, `${item.successRate}%`])} />
          <DataTableCard title="Mediators Pending Review" columns={["ชื่อ", "จังหวัด", "สถานะ", "เคส"]} rows={data.mediatorRows.filter((item) => item.status !== "approved").slice(0, 8).map((item) => [item.name, item.province, <StatusBadge key={item.id} status={item.status} />, item.cases])} />
          <DataTableCard title="Mediators with Low Trust Score" columns={["ชื่อ", "จังหวัด", "Trust Score", "Rating"]} rows={data.mediatorRows.filter((item) => item.score < 50).slice(0, 8).map((item) => [item.name, item.province, <TrustScoreBadge key={item.id} score={item.score} />, item.rating.toFixed(1)])} />
        </section>
      </DashboardLayout>
    </AdminShell>
  );
}
