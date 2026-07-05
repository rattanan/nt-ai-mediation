import Link from "next/link";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardList,
  CreditCard,
  Gauge,
  LayoutDashboard,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CaseStatus } from "@/types/database";

const dashboardStatusLabels: Record<CaseStatus, string> = {
  draft: "แบบร่าง",
  submitted: "ส่งคำขอแล้ว",
  reviewing: "กำลังตรวจสอบ",
  admin_review: "รอตรวจโดยผู้ดูแล",
  needs_more_info: "ขอข้อมูลเพิ่มเติม",
  creditor_review: "รอเจ้าหนี้ตรวจสอบ",
  creditor_accepted: "เจ้าหนี้ตอบรับ",
  creditor_rejected: "เจ้าหนี้ปฏิเสธ",
  matched: "จับคู่แล้ว",
  mediator_matching: "กำลังจับคู่ผู้ไกล่เกลี่ย",
  mediator_selected: "เลือกผู้ไกล่เกลี่ยแล้ว",
  scheduled: "นัดหมายแล้ว",
  appointment_scheduling: "กำลังนัดหมาย",
  in_mediation: "อยู่ระหว่างไกล่เกลี่ย",
  settlement_draft: "ร่างข้อตกลง",
  settled: "ตกลงสำเร็จ",
  not_settled: "ตกลงไม่สำเร็จ",
  closed: "ปิดเคส",
};

export const dashboardNavItems = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/dashboard/cases", label: "Cases", icon: ClipboardList },
  { href: "/admin/dashboard/financial", label: "Financial", icon: CreditCard },
  { href: "/admin/dashboard/mediators", label: "Mediators", icon: UserRound },
  { href: "/admin/dashboard/creditors", label: "Creditors", icon: Building2 },
  { href: "/admin/dashboard/debtors", label: "Debtors", icon: Users },
  { href: "/admin/dashboard/sla-risk", label: "SLA & Risk", icon: AlertTriangle },
  { href: "/admin/dashboard/reviews-trust-score", label: "Reviews & Trust Score", icon: Star },
];

export function DashboardLayout({
  activePath,
  title,
  description,
  children,
}: {
  activePath: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const activeLabel = dashboardNavItems.find((item) => item.href === activePath)?.label ?? title;

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm text-[#6B7280]">
            <span>Dashboard</span>
            <span>/</span>
            <span className="font-semibold text-[#111827]">{activeLabel}</span>
          </div>
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6B7280]">{description}</p>
        </div>
        <DashboardTabs activePath={activePath} />
      </div>
      {children}
    </div>
  );
}

export function DashboardTabs({ activePath }: { activePath: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-black/5 bg-white p-1 shadow-sm">
      <nav className="flex min-w-max gap-1" aria-label="Dashboard sections">
        {dashboardNavItems.map(({ href, label, icon: Icon }) => {
          const active = href === activePath;
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold transition ${
                active ? "bg-[#FFD200] text-[#111827] shadow-sm" : "text-[#4B5563] hover:bg-[#FFF7D1] hover:text-[#111827]"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function KpiGrid({ children }: { children: ReactNode }) {
  return <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">{children}</section>;
}

export function formatDashboardNumber(value: number | null | undefined) {
  const number = Number(value ?? 0);
  return number.toLocaleString("th-TH", {
    minimumFractionDigits: Math.abs(number) >= 1000 ? 0 : 0,
    maximumFractionDigits: Math.abs(number) >= 1000 ? 0 : 2,
  });
}

export function dashboardMoney(value: number | null | undefined, currency = "THB") {
  return `${formatDashboardNumber(value)} ${currency}`;
}

export function KpiCard({
  label,
  value,
  caption,
  icon: Icon = Gauge,
}: {
  label: string;
  value: string | number;
  caption?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF2A8] text-[#8A6500]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold">{typeof value === "number" ? formatDashboardNumber(value) : value}</p>
      {caption ? <p className="mt-1 text-xs text-[#6B7280]">{caption}</p> : null}
    </div>
  );
}

export function ChartGrid({ children }: { children: ReactNode }) {
  return <section className="grid gap-6 xl:grid-cols-2">{children}</section>;
}

export function ChartCard({
  title,
  items,
  format = formatDashboardNumber,
}: {
  title: string;
  items: { label: string; value: number }[];
  format?: (value: number) => string;
}) {
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[#A87900]" aria-hidden="true" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <EmptyState message="ยังไม่มีข้อมูลสำหรับ chart นี้" />
        ) : (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex justify-between gap-3 text-sm">
                <span className="truncate text-[#4B5563]">{dashboardStatusLabels[item.label as CaseStatus] ?? item.label}</span>
                <span className="font-semibold">{format(item.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#E5E7EB]">
                <div className="h-full rounded-full bg-[#FFD200]" style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} />
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export function DataTableCard({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: Array<Array<ReactNode>>;
}) {
  return (
    <section className="rounded-lg border border-black/5 bg-white shadow-sm">
      <div className="border-b border-black/5 px-5 py-4">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
            <tr>{columns.map((column) => <th key={column} className="px-5 py-3">{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-5 py-10"><EmptyState message="ยังไม่มีข้อมูลในตารางนี้" /></td></tr>
            ) : rows.map((row, index) => (
              <tr key={index} className="border-t border-black/5">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="px-5 py-3 align-top">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function StatusBadge({ status }: { status: CaseStatus | string }) {
  const tone = status.includes("rejected") || status.includes("failed") || status.includes("overdue")
    ? "bg-[#FEE2E2] text-[#991B1B]"
    : status.includes("settled") || status.includes("closed") || status.includes("approved")
      ? "bg-[#DCFCE7] text-[#166534]"
      : "bg-[#FEF3C7] text-[#92400E]";

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tone}`}>{dashboardStatusLabels[status as CaseStatus] ?? status}</span>;
}

export function TrustScoreBadge({ score }: { score: number }) {
  const label = score >= 85 ? "Elite" : score >= 70 ? "Trusted" : score >= 50 ? "Verified" : "Review";
  return <Badge>{formatDashboardNumber(score)} · {label}</Badge>;
}

export function EmptyState({ message }: { message: string }) {
  return <p className="py-3 text-center text-sm text-[#6B7280]">{message}</p>;
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] p-4 text-sm font-medium text-[#991B1B]">
      {message}
    </div>
  );
}
