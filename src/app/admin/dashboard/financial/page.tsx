import { Banknote, CreditCard, HandCoins, Receipt, TrendingUp, WalletCards } from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { ChartCard, ChartGrid, DashboardLayout, DataTableCard, dashboardMoney, KpiCard, KpiGrid, StatusBadge } from "@/components/admin/dashboard/dashboard-components";
import { requireAdmin } from "@/lib/admin/auth";
import { getFinancialDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function FinancialDashboardPage() {
  const profile = await requireAdmin();
  const data = await getFinancialDashboardData();

  return (
    <AdminShell profile={profile} activePath="/admin/dashboard" title="Financial Dashboard" subtitle="ภาพรวมรายได้ ค่าธรรมเนียม invoice และการฟื้นตัวของหนี้">
      <DashboardLayout activePath="/admin/dashboard/financial" title="Financial" description="โฟกัสเฉพาะตัวเลขการเงิน รายได้ และ invoice สำหรับผู้บริหารและฝ่ายบัญชี">
        <KpiGrid>
          <KpiCard label="Total Debt Amount" value={dashboardMoney(data.kpis.totalDebt)} icon={Banknote} />
          <KpiCard label="Total Settlement Amount" value={dashboardMoney(data.kpis.settledDebt)} icon={HandCoins} />
          <KpiCard label="Total Platform Fee" value={dashboardMoney(data.kpis.platformFee)} icon={CreditCard} />
          <KpiCard label="Total Success Fee" value={dashboardMoney(data.kpis.successFee)} icon={TrendingUp} />
          <KpiCard label="Total Revenue" value={dashboardMoney(data.kpis.totalRevenue)} icon={Receipt} />
          <KpiCard label="Outstanding Invoice Amount" value={dashboardMoney(data.outstandingInvoiceAmount)} icon={WalletCards} />
        </KpiGrid>

        <ChartGrid>
          <ChartCard title="Monthly Revenue" items={data.charts.monthlyRevenue.map((item) => ({ label: item.label, value: item.platformFee + item.successFee }))} format={(value) => dashboardMoney(value)} />
          <ChartCard title="Platform Fee vs Success Fee" items={[{ label: "Platform Fee", value: data.kpis.platformFee }, { label: "Success Fee", value: data.kpis.successFee }]} format={(value) => dashboardMoney(value)} />
          <ChartCard title="Settlement Amount by Debt Type" items={data.charts.debtByType.slice(0, 8)} format={(value) => dashboardMoney(value)} />
          <ChartCard title="Revenue by Creditor" items={data.tables.topCreditors.map((item) => ({ label: item.name, value: item.settled }))} format={(value) => dashboardMoney(value)} />
        </ChartGrid>

        <section className="grid gap-6 xl:grid-cols-3">
          <DataTableCard title="Recent Invoices" columns={["เลข invoice", "สถานะ", "ยอดรวม", "ออกเมื่อ"]} rows={data.tables.invoices.slice(0, 8).map((item) => [item.invoice_number, <StatusBadge key={item.id} status={item.status} />, dashboardMoney(item.total_amount), new Date(item.issued_at).toLocaleDateString("th-TH")])} />
          <DataTableCard title="Unpaid Invoices" columns={["เลข invoice", "สถานะ", "ยอดรวม", "ครบกำหนด"]} rows={data.unpaidInvoices.slice(0, 8).map((item) => [item.invoice_number, <StatusBadge key={item.id} status={item.status} />, dashboardMoney(item.total_amount), item.due_at ? new Date(item.due_at).toLocaleDateString("th-TH") : "-"])} />
          <DataTableCard title="Top Creditors by Revenue" columns={["เจ้าหนี้", "เคส", "ยอดตกลง"]} rows={data.tables.topCreditors.map((item) => [item.name, item.cases, dashboardMoney(item.settled)])} />
        </section>
      </DashboardLayout>
    </AdminShell>
  );
}
