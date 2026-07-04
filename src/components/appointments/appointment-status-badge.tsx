import { Badge } from "@/components/ui/badge";
import { appointmentStatusLabels } from "@/lib/appointments";
import type { AppointmentStatus } from "@/types/database";

const statusClasses: Record<AppointmentStatus, string> = {
  requested: "border-blue-200 bg-blue-50 text-blue-700",
  pending_confirmation: "border-[#F5B800]/30 bg-[#FFF8D9] text-[#6B4F00]",
  confirmed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  reschedule_requested: "border-orange-200 bg-orange-50 text-orange-700",
  completed: "border-slate-200 bg-slate-50 text-slate-700",
  cancelled: "border-red-200 bg-red-50 text-red-700",
  no_show: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge className={statusClasses[status]}>{appointmentStatusLabels[status]}</Badge>;
}
