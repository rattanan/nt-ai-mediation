import {
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck,
  Scale,
  UserRound,
  Users,
} from "lucide-react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdmin } from "@/lib/admin/auth";
import { getAdminDashboardData } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

const roleLabels: Record<string, string> = {
  debtor: "ลูกหนี้",
  mediator: "ผู้ไกล่เกลี่ย",
  creditor: "เจ้าหนี้",
};

const statusLabels: Record<string, string> = {
  draft: "ร่าง",
  submitted: "ส่งคำขอแล้ว",
  reviewing: "ตรวจสอบ",
  needs_more_info: "ขอข้อมูลเพิ่ม",
  matched: "จับคู่แล้ว",
  matching: "รอจับคู่",
  scheduled: "นัดหมายแล้ว",
  in_mediation: "กำลังไกล่เกลี่ย",
  settled: "ตกลงสำเร็จ",
  closed: "ปิดเคส",
};

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-[#6B7280]">{label}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFF2A8]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-3xl font-semibold">{value.toLocaleString("th-TH")}</p>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const profile = await requireAdmin();
  const data = await getAdminDashboardData();

  return (
    <AdminShell
      profile={profile}
      activePath="/admin/dashboard"
      title="แดชบอร์ดผู้ดูแลระบบ"
      subtitle="ภาพรวมผู้ใช้งาน เคส นัดหมาย และผลการไกล่เกลี่ยของแพลตฟอร์ม"
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total users" value={data.totalUsers} icon={Users} />
        <MetricCard label="Total debtors" value={data.totalDebtors} icon={UserRound} />
        <MetricCard label="Total mediators" value={data.totalMediators} icon={Scale} />
        <MetricCard label="Total creditors" value={data.totalCreditors} icon={FileCheck} />
        <MetricCard label="Total cases" value={data.totalCases} icon={ClipboardList} />
        <MetricCard label="Pending cases" value={data.pendingCases} icon={Clock3} />
        <MetricCard label="Scheduled appointments" value={data.scheduledAppointments} icon={CalendarClock} />
        <MetricCard label="Completed settlements" value={data.completedSettlements} icon={CheckCircle2} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Recent registered users</h2>
          <div className="mt-4 space-y-3">
            {data.recentUsers.length === 0 ? (
              <p className="text-sm text-[#6B7280]">ยังไม่มีผู้ใช้งาน</p>
            ) : (
              data.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-4 py-3">
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-[#6B7280]">{user.email ?? "ไม่มีอีเมลในโปรไฟล์"}</p>
                  </div>
                  <span className="rounded-full bg-[#FFF2A8] px-3 py-1 text-xs font-semibold">
                    {roleLabels[user.role] ?? user.role}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Recent mediation cases</h2>
          <div className="mt-4 space-y-3">
            {data.recentCases.length === 0 ? (
              <p className="text-sm text-[#6B7280]">ยังไม่มีเคสไกล่เกลี่ย</p>
            ) : (
              data.recentCases.map((item) => (
                <div key={item.id} className="rounded-lg bg-[#F8FAFC] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{item.case_number}</p>
                    <span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs font-semibold">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    {item.debt_type} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Case status summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {data.caseStatusCounts.map((item) => (
              <div key={item.status} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-4 py-3">
                <span className="text-sm text-[#4B5563]">{statusLabels[item.status] ?? item.status}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">User role summary</h2>
          <div className="mt-4 space-y-3">
            {data.roleCounts.map((item) => (
              <div key={item.role} className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-4 py-3">
                <span className="text-sm text-[#4B5563]">{roleLabels[item.role] ?? item.role}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
