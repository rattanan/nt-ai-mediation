import {
  Banknote,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileWarning,
  HandCoins,
  Scale,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { caseStatusLabels } from "@/lib/cases";
import { money } from "@/lib/closing";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

function KpiCard({ label, value, caption, icon: Icon }: { label: string; value: string | number; caption?: string; icon: typeof Users }) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2A8]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold">{typeof value === "number" ? value.toLocaleString("th-TH") : value}</p>
      {caption ? <p className="mt-1 text-xs text-[#6B7280]">{caption}</p> : null}
    </div>
  );
}

function BarChart({ title, items, format = (value: number) => value.toLocaleString("th-TH") }: { title: string; items: { label: string; value: number }[]; format?: (value: number) => string }) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีข้อมูล</p> : items.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex justify-between gap-3 text-sm">
              <span className="truncate text-[#4B5563]">{caseStatusLabels[item.label as keyof typeof caseStatusLabels] ?? item.label}</span>
              <span className="font-semibold">{format(item.value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
              <div className="h-full rounded-full bg-[#FFD200]" style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataTable({ title, columns, rows }: { title: string; columns: string[]; rows: Array<Array<string | number>> }) {
  return (
    <section className="rounded-lg border border-black/5 bg-white shadow-sm">
      <div className="border-b border-black/5 px-5 py-4">
        <h2 className="font-semibold">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
            <tr>{columns.map((column) => <th key={column} className="px-5 py-3">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-5 py-10 text-center text-[#6B7280]">ยังไม่มีข้อมูล</td></tr>
            ) : rows.map((row, index) => (
              <tr key={index} className="border-t border-black/5">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-3">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();
  const data = await getAdminDashboardData();
  const kpi = data.kpis;

  return (
    <AdminShell
      profile={profile}
      activePath="/admin/dashboard"
      title="Dashboard & Executive Reports"
      subtitle="ภาพรวมระบบไกล่เกลี่ยหนี้ออนไลน์สำหรับผู้บริหารและผู้ดูแลระบบ"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
        <span>Admin</span><span>/</span><span className="font-semibold text-[#111827]">Dashboard</span>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="จำนวนเคสทั้งหมด" value={kpi.totalCases} icon={ClipboardList} />
        <KpiCard label="เคสใหม่วันนี้" value={kpi.newToday} icon={Clock3} />
        <KpiCard label="กำลังไกล่เกลี่ย" value={kpi.activeCases} icon={CalendarClock} />
        <KpiCard label="ไกล่เกลี่ยสำเร็จ" value={kpi.successfulCases} icon={CheckCircle2} />
        <KpiCard label="ไกล่เกลี่ยไม่สำเร็จ" value={kpi.failedCases} icon={FileWarning} />
        <KpiCard label="อัตราสำเร็จ" value={`${kpi.successRate}%`} icon={TrendingUp} />
        <KpiCard label="มูลหนี้รวม" value={money(kpi.totalDebt)} icon={Banknote} />
        <KpiCard label="มูลหนี้ที่ตกลงสำเร็จ" value={money(kpi.settledDebt)} icon={HandCoins} />
        <KpiCard label="Platform Fee" value={money(kpi.platformFee)} icon={Scale} />
        <KpiCard label="Success Fee" value={money(kpi.successFee)} icon={TrendingUp} />
        <KpiCard label="รายได้รวม" value={money(kpi.totalRevenue)} icon={Banknote} />
        <KpiCard label="ผู้ไกล่เกลี่ยพร้อมรับงาน" value={kpi.readyMediators} icon={UserRound} />
        <KpiCard label="เจ้าหนี้ที่เข้าร่วม" value={kpi.creditors} icon={Building2} />
        <KpiCard label="ลูกหนี้ที่สมัคร" value={kpi.debtors} icon={Users} />
        <KpiCard label="รีวิวรออนุมัติ" value={data.tables.pendingReviewCount} icon={FileWarning} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <BarChart title="จำนวนเคสรายเดือน" items={data.charts.monthlyCases} />
        <BarChart title="สถานะเคส" items={data.charts.statusCounts} />
        <BarChart title="มูลหนี้ตามประเภทหนี้" items={data.charts.debtByType.slice(0, 8)} format={(value) => money(value)} />
        <BarChart title="จังหวัดที่มีเคสมากที่สุด" items={data.charts.provinceCounts} />
        <BarChart title="Aging Report" items={data.charts.aging} />
        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">รายได้ Platform Fee / Success Fee รายเดือน</h2>
          <div className="mt-4 space-y-3">
            {data.charts.monthlyRevenue.map((item) => (
              <div key={item.label} className="rounded-lg bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between"><span className="font-medium">{item.label}</span><Badge>{money(item.platformFee + item.successFee)}</Badge></div>
                <p className="mt-1 text-sm text-[#6B7280]">Platform {money(item.platformFee)} · Success {money(item.successFee)}</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <DataTable
          title="เคสล่าสุด"
          columns={["เลขเคส", "เจ้าหนี้", "ประเภทหนี้", "สถานะ", "ยอดหนี้"]}
          rows={data.tables.recentCases.map((item) => [item.case_number, item.creditor_name, item.debt_type, caseStatusLabels[item.status], money(item.debt_amount)])}
        />
        <DataTable
          title="เคสที่ใกล้ครบ SLA"
          columns={["เลขเคส", "สถานะ", "จังหวัด", "อัปเดตล่าสุด"]}
          rows={data.tables.slaCases.map((item) => [item.case_number, caseStatusLabels[item.status], item.province, new Date(item.updated_at).toLocaleDateString("th-TH")])}
        />
        <DataTable
          title="เคสความเสี่ยงสูง"
          columns={["เลขเคส", "ประเภทหนี้", "ค้างชำระ", "ยอดหนี้"]}
          rows={data.tables.highRiskCases.map((item) => [item.case_number, item.debt_type, `${item.overdue_months} เดือน`, money(item.debt_amount)])}
        />
        <DataTable
          title="ผู้ไกล่เกลี่ยผลงานดีที่สุด"
          columns={["ชื่อ", "จังหวัด", "เคส", "Trust Score", "Rating"]}
          rows={data.tables.topMediators.map((item) => [item.name, item.province, item.cases, item.score, item.rating.toFixed(1)])}
        />
        <DataTable
          title="เจ้าหนี้ที่มีเคสมากที่สุด"
          columns={["องค์กร", "เคส", "มูลหนี้", "ยอดตกลง"]}
          rows={data.tables.topCreditors.map((item) => [item.name, item.cases, money(item.debt), money(item.settled)])}
        />
      </section>
    </AdminShell>
  );
}
