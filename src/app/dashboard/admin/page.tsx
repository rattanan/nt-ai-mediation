import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { dashboardPlaceholders } from "@/data/landing";

export default function AdminDashboardPage() {
  return <DashboardPlaceholder data={dashboardPlaceholders.admin} />;
}
