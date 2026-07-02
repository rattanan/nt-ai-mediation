import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { dashboardPlaceholders } from "@/data/landing";

export default function DebtorDashboardPage() {
  return <DashboardPlaceholder data={dashboardPlaceholders.debtor} />;
}
