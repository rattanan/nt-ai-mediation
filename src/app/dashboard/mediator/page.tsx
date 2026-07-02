import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { dashboardPlaceholders } from "@/data/landing";

export default function MediatorDashboardPage() {
  return <DashboardPlaceholder data={dashboardPlaceholders.mediator} />;
}
