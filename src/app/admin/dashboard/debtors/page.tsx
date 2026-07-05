import { CalendarClock, CheckCircle2, ClipboardList, UserPlus, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChartCard, ChartGrid, DashboardLayout, DataTableCard, KpiCard, KpiGrid, StatusBadge } from "@/components/admin/dashboard/dashboard-components";
import { requireAdmin } from "@/lib/admin/auth";
import { getDebtorDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

function groupDebtorsByMonth(debtors: { created_at: string }[]) {
  const map = new Map<string, number>();
  debtors.forEach((item) => map.set(item.created_at.slice(0, 7), (map.get(item.created_at.slice(0, 7)) ?? 0) + 1));
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([label, value]) => ({ label, value }));
}

export default async function DebtorsDashboardPage() {
  const profile = await requireAdmin();
  const data = await getDebtorDashboardData();

  return (
    <AdminShell profile={profile} activePath="/admin/dashboard" title="Debtors Dashboard" subtitle="ภาพรวมลูกหนี้ การสมัคร เคส active และสถานะการไกล่เกลี่ย">
      <DashboardLayout activePath="/admin/dashboard/debtors" title="Debtors" description="ติดตามลูกหนี้ในระบบและกลุ่มที่กำลังรอขั้นตอนสำคัญ เช่น AI interview หรือนัดหมาย">
        <KpiGrid>
          <KpiCard label="Total Debtors" value={data.debtors.length} icon={Users} />
          <KpiCard label="New Debtors This Month" value={data.newDebtorsThisMonth.length} icon={UserPlus} />
          <KpiCard label="Debtors with Active Cases" value={data.debtorsWithActiveCases.length} icon={ClipboardList} />
          <KpiCard label="Debtors with Settlement Plans" value={data.debtorsWithSettlementPlans.length} icon={CalendarClock} />
          <KpiCard label="Debtors Completed Mediation" value={data.debtorsWithSettlementPlans.length} icon={CheckCircle2} />
        </KpiGrid>

        <ChartGrid>
          <ChartCard title="Debtors by Province" items={data.charts.provinceCounts.slice(0, 8)} />
          <ChartCard title="Debtors by Occupation Type" items={[{ label: "ไม่ระบุ", value: data.debtors.length }]} />
          <ChartCard title="Debtors by Debt Type" items={data.charts.debtByType.slice(0, 8)} />
          <ChartCard title="Debtor Registration Trend" items={groupDebtorsByMonth(data.debtors)} />
        </ChartGrid>

        <section className="grid gap-6 xl:grid-cols-3">
          <DataTableCard title="Recent Debtors" columns={["ชื่อ", "อีเมล", "สถานะบัญชี", "สมัครเมื่อ"]} rows={data.debtors.slice(0, 8).map((item) => [item.full_name, item.email ?? "-", <StatusBadge key={item.id} status={item.account_status} />, new Date(item.created_at).toLocaleDateString("th-TH")])} />
          <DataTableCard title="Debtors Waiting for AI Interview" columns={["เลขเคส", "เจ้าหนี้", "สถานะ"]} rows={data.tables.allCases.filter((item) => item.status === "submitted" || item.status === "reviewing").slice(0, 8).map((item) => [item.case_number, item.creditor_name, <StatusBadge key={item.id} status={item.status} />])} />
          <DataTableCard title="Debtors with Upcoming Appointment" columns={["เคส", "วันที่", "สถานะ"]} rows={data.tables.appointments.slice(0, 8).map((item) => [item.case_id, item.appointment_date, <StatusBadge key={item.id} status={item.status} />])} />
        </section>
      </DashboardLayout>
    </AdminShell>
  );
}
