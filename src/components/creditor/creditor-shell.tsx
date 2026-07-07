import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, CalendarClock, FileText, Home, LogOut, Settings } from "lucide-react";
import { logout } from "@/app/auth/actions";
import { NtLogoMark } from "@/components/nt-logo-mark";
import { AppFooter } from "@/components/app-footer";
import type { AuthProfile } from "@/lib/auth/server";
import { getCreditorOfficer } from "@/lib/creditor";
import { countOpenCreditorCases, countUnpaidCreditorInvoices, countUpcomingCreditorAppointments } from "@/lib/portal-counts";

const navItems = [
  { href: "/creditor", label: "ภาพรวม", icon: Home },
  { href: "/creditor/organization", label: "องค์กรเจ้าหนี้", icon: BadgeCheck },
  { href: "/creditor/cases", label: "เคส", icon: FileText },
  { href: "/creditor/appointments", label: "นัดหมาย", icon: CalendarClock },
  { href: "/creditor/billing", label: "Billing", icon: FileText },
  { href: "/creditor/settings", label: "ตั้งค่า", icon: Settings },
];

export async function CreditorShell({
  profile,
  title,
  subtitle,
  activePath,
  children,
}: {
  profile: AuthProfile;
  title: string;
  subtitle: string;
  activePath: string;
  children: ReactNode;
}) {
  const officer = await getCreditorOfficer(profile.id);
  const organizationId = officer?.organization_id;
  const [openCases, upcomingAppointments, unpaidInvoices] = await Promise.all([
    countOpenCreditorCases(organizationId),
    countUpcomingCreditorAppointments(organizationId),
    countUnpaidCreditorInvoices(organizationId),
  ]);
  const itemCounts: Record<string, number> = {
    "/creditor/cases": openCases,
    "/creditor/appointments": upcomingAppointments,
    "/creditor/billing": unpaidInvoices,
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-black/5 bg-white lg:flex lg:flex-col">
          <div className="border-b border-black/5 px-6 py-5">
            <Link href="/" className="flex items-center gap-3">
              <NtLogoMark />
              <div>
                <p className="text-xs font-semibold uppercase text-[#A87900]">NT AI</p>
                <p className="text-sm font-semibold">Creditor Portal</p>
              </div>
            </Link>
          </div>
          <nav className="flex-1 space-y-1 px-4 py-5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const count = itemCounts[href] ?? 0;
              return (
              <Link
                key={label}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  activePath === href ? "bg-[#FFD200]" : "text-[#4B5563] hover:bg-[#FFF7D1]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="min-w-0 flex-1">{label}</span>
                {count > 0 ? (
                  <span className="rounded-full bg-[#111827] px-2 py-0.5 text-xs font-semibold text-white">{count.toLocaleString("th-TH")}</span>
                ) : null}
              </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-black/5 bg-white px-5 py-4 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase text-[#A87900]">Creditor Portal</p>
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="mt-1 text-sm text-[#6B7280]">{subtitle}</p>
              </div>
              <form action={logout}>
                <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#111827] px-3 text-sm font-semibold text-white" type="submit">
                  <span>{profile.full_name}</span>
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </div>
          </header>
          <main className="flex-1 px-5 py-6 lg:px-8">{children}</main>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}
