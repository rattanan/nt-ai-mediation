import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  Building2,
  CalendarClock,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { logout } from "@/app/auth/actions";
import type { AuthProfile } from "@/lib/auth/server";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "User Management", icon: Users },
  { href: "/admin/creditors", label: "Creditors", icon: Building2 },
  { href: "/admin/cases", label: "Cases", icon: FileText },
  { href: "/admin/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  profile,
  activePath,
  title,
  subtitle,
  children,
}: {
  profile: AuthProfile;
  activePath: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-black/5 bg-white lg:flex lg:flex-col">
          <div className="border-b border-black/5 px-6 py-5">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFD200] font-bold">
                NT
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-[#A87900]">Admin Console</p>
                <p className="text-sm font-semibold">AI Mediation Platform</p>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-4 py-5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = activePath === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-[#FFD200] text-[#111827] shadow-sm"
                      : "text-[#4B5563] hover:bg-[#FFF7D1] hover:text-[#111827]"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-black/5 bg-white">
            <div className="flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase text-[#A87900]">NT AI Admin</p>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#4B5563]">
                  {profile.full_name}
                </span>
                <form action={logout}>
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#111827] px-3 text-sm font-semibold text-white hover:bg-black"
                  >
                    ออกจากระบบ
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  </button>
                </form>
              </div>
            </div>
            <nav className="flex gap-2 overflow-x-auto px-5 pb-4 lg:hidden">
              {navItems.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${
                    activePath === href ? "bg-[#FFD200]" : "bg-[#F3F4F6] text-[#4B5563]"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </header>

          <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
