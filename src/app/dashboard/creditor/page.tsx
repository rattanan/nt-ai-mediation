import { DashboardPlaceholder } from "@/components/dashboard/dashboard-placeholder";
import { dashboardPlaceholders } from "@/data/landing";

export default function CreditorDashboardPage() {
  return <DashboardPlaceholder data={dashboardPlaceholders.creditor} />;
}
