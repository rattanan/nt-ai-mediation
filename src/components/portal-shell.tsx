import Link from "next/link";
import type React from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ClipboardList,
  FileText,
  Home,
  LogOut,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { logout } from "@/app/auth/actions";

type MetricCard = {
  label: string;
  value: string;
  caption: string;
  icon: LucideIcon;
};

type SidebarItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

type EmptyTable = {
  title: string;
  description: string;
  columns: string[];
  actionLabel: string;
};

export function PortalShell({
  roleLabel,
  title,
  subtitle,
  userName,
  metrics,
  sidebarItems,
  table,
  children,
}: {
  roleLabel: string;
  title: string;
  subtitle: string;
  userName: string;
  metrics: MetricCard[];
  sidebarItems: SidebarItem[];
  table: EmptyTable;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F7F7F7] text-[#1F2937]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-black/5 bg-white lg:flex lg:flex-col">
          <div className="border-b border-black/5 px-6 py-5">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFD200]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#F5B800]">NT AI</p>
                <p className="text-sm font-semibold">Mediation Platform</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {sidebarItems.map(({ label, icon: Icon, active }) => (
              <a
                key={label}
                href="#"
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#FFD200] text-[#1F2937] shadow-sm"
                    : "text-[#4B5563] hover:bg-[#FFF7D1] hover:text-[#1F2937]"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
          </nav>

          <div className="border-t border-black/5 p-4">
            <div className="rounded-lg bg-[#F7F7F7] p-4">
              <p className="text-xs font-semibold text-[#6B7280]">สถานะระบบ</p>
              <p className="mt-1 text-sm font-semibold text-[#1F2937]">พร้อมใช้งาน</p>
              <p className="mt-1 text-xs leading-5 text-[#6B7280]">ข้อมูลตัวอย่าง ยังไม่เชื่อมต่อฐานข้อมูลจริง</p>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-black/5 bg-white">
            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase text-[#F5B800]">{roleLabel}</p>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#6B7280] sm:flex">
                  <Search className="h-4 w-4" />
                  ค้นหาเคสหรือเลขคำขอ
                </div>
                <button
                  type="button"
                  aria-label="การแจ้งเตือน"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#FFF7D1]"
                >
                  <Bell className="h-4 w-4" />
                </button>
                <form action={logout}>
                  <button
                    type="submit"
                    className="flex h-10 items-center gap-2 rounded-lg bg-[#1F2937] px-3 text-sm font-semibold text-white hover:bg-black"
                  >
                    <span className="hidden max-w-28 truncate sm:inline">{userName}</span>
                    <span className="sm:hidden">ออก</span>
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 lg:px-8">
            <div className="mb-5 grid grid-cols-2 gap-2 lg:hidden">
              {sidebarItems.slice(0, 4).map(({ label, icon: Icon, active }) => (
                <a
                  key={label}
                  href="#"
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? "bg-[#FFD200]" : "bg-white text-[#4B5563]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              ))}
            </div>

            {metrics.length > 0 ? (
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map(({ label, value, caption, icon: Icon }) => (
                  <div key={label} className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-[#6B7280]">{label}</p>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FFF2A8]">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-semibold">{value}</p>
                    <p className="mt-2 text-xs text-[#6B7280]">{caption}</p>
                  </div>
                ))}
              </section>
            ) : null}

            {children}

            {table.columns.length > 0 ? (
              <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_22rem]">
              <div className="rounded-lg border border-black/5 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-black/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{table.title}</h2>
                    <p className="mt-1 text-sm text-[#6B7280]">{table.description}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#FFD200] px-4 py-2 text-sm font-semibold text-[#1F2937] hover:bg-[#F5B800]"
                  >
                    <FileText className="h-4 w-4" />
                    {table.actionLabel}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-[#F7F7F7] text-xs font-semibold uppercase text-[#6B7280]">
                      <tr>
                        {table.columns.map((column) => (
                          <th key={column} className="px-5 py-3">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={table.columns.length} className="px-5 py-14 text-center">
                          <div className="mx-auto flex max-w-sm flex-col items-center">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#FFF2A8]">
                              <ClipboardList className="h-5 w-5" />
                            </div>
                            <p className="mt-4 font-semibold">ยังไม่มีข้อมูลในตารางนี้</p>
                            <p className="mt-2 text-sm leading-6 text-[#6B7280]">
                              เมื่อเชื่อมต่อ Supabase แล้ว รายการจริงจะแสดงในพื้นที่นี้
                            </p>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <aside className="space-y-4">
                <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFD200]">
                      <Home className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="font-semibold">ภาพรวมวันนี้</h2>
                      <p className="text-sm text-[#6B7280]">ข้อมูล mock สำหรับออกแบบหน้าจอ</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">งานรอดำเนินการ</span>
                      <span className="font-semibold">0 รายการ</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">อัปเดตล่าสุด</span>
                      <span className="font-semibold">วันนี้</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#6B7280]">สถานะเชื่อมต่อ</span>
                      <span className="font-semibold text-[#15803D]">พร้อมออกแบบ</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-black/5 bg-[#1F2937] p-5 text-white shadow-sm">
                  <Settings className="h-5 w-5 text-[#FFD200]" />
                  <h2 className="mt-4 font-semibold">ขั้นตอนถัดไป</h2>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    เชื่อมต่อ Supabase auth, โหลดข้อมูลตามบทบาท และบันทึก audit log ในรอบถัดไป
                  </p>
                </div>
              </aside>
              </section>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}
