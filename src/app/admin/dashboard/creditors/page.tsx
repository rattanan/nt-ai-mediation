import { Building2, CheckCircle2, HandCoins, TrendingUp, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChartCard, ChartGrid, DashboardLayout, DataTableCard, dashboardMoney, KpiCard, KpiGrid, StatusBadge } from "@/components/admin/dashboard/dashboard-components";
import { requireAdmin } from "@/lib/admin/auth";
import { getCreditorDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function CreditorsDashboardPage() {
  const profile = await requireAdmin();
  const data = await getCreditorDashboardData();
  const activeCreditors = data.creditorRows.filter((item) => item.status === "approved");
  const averageRecoveryRate = data.creditorRows.length ? Math.round(data.creditorRows.reduce((sum, item) => sum + item.recoveryRate, 0) / data.creditorRows.length) : 0;
  const totalRevenue = data.creditorRows.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <AdminShell profile={profile} activePath="/admin/dashboard" title="Creditors Dashboard" subtitle="ภาพรวมองค์กรเจ้าหนี้ เคส recovery และรายได้">
      <DashboardLayout activePath="/admin/dashboard/creditors" title="Creditors" description="ดูผลงานของเจ้าหนี้แต่ละองค์กร ตั้งแต่จำนวนเคส อัตราฟื้นตัว รายได้ และคิวอนุมัติ">
        <KpiGrid>
          <KpiCard label="Total Creditors" value={data.creditorRows.length} icon={Building2} />
          <KpiCard label="Active Creditors" value={activeCreditors.length} icon={CheckCircle2} />
          <KpiCard label="Total Cases from Creditors" value={data.creditorRows.reduce((sum, item) => sum + item.cases, 0)} icon={Users} />
          <KpiCard label="Average Recovery Rate" value={`${averageRecoveryRate}%`} icon={TrendingUp} />
          <KpiCard label="Total Revenue from Creditors" value={dashboardMoney(totalRevenue)} icon={HandCoins} />
        </KpiGrid>

        <ChartGrid>
          <ChartCard title="Cases by Creditor" items={data.creditorRows.slice(0, 8).map((item) => ({ label: item.name, value: item.cases }))} />
          <ChartCard title="Recovery Rate by Creditor" items={data.creditorRows.slice(0, 8).map((item) => ({ label: item.name, value: item.recoveryRate }))} format={(value) => `${value}%`} />
          <ChartCard title="Revenue by Creditor" items={data.creditorRows.slice(0, 8).map((item) => ({ label: item.name, value: item.revenue }))} format={(value) => dashboardMoney(value)} />
          <ChartCard title="Debt Amount by Creditor Type" items={data.creditorRows.reduce<{ label: string; value: number }[]>((rows, item) => {
            const current = rows.find((row) => row.label === item.type);
            if (current) current.value += item.debt;
            else rows.push({ label: item.type, value: item.debt });
            return rows;
          }, [])} format={(value) => dashboardMoney(value)} />
        </ChartGrid>

        <section className="grid gap-6 xl:grid-cols-3">
          <DataTableCard title="Top Creditors" columns={["องค์กร", "เคส", "Recovery", "Revenue"]} rows={data.creditorRows.sort((a, b) => b.cases - a.cases).slice(0, 8).map((item) => [item.name, item.cases, `${item.recoveryRate}%`, dashboardMoney(item.revenue)])} />
          <DataTableCard title="Creditors Pending Approval" columns={["องค์กร", "ประเภท", "สถานะ"]} rows={data.creditorRows.filter((item) => item.status === "pending").slice(0, 8).map((item) => [item.name, item.type, <StatusBadge key={item.id} status={item.status} />])} />
          <DataTableCard title="Creditors with High Failed Cases" columns={["องค์กร", "Failed Cases", "Cases"]} rows={data.creditorRows.sort((a, b) => b.failedCases - a.failedCases).filter((item) => item.failedCases > 0).slice(0, 8).map((item) => [item.name, item.failedCases, item.cases])} />
        </section>
      </DashboardLayout>
    </AdminShell>
  );
}
