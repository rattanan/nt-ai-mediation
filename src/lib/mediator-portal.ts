import { CalendarCheck2, ClipboardCheck, Clock, FileText, UserCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export function mediatorSidebar(activePath: "/mediator" | "/mediator/profile" | "/mediator/cases" | "/mediator/appointments" | "/mediator/availability") {
  return [
    { label: "ภาพรวม", href: "/mediator", icon: UserCheck, active: activePath === "/mediator" },
    { label: "โปรไฟล์", href: "/mediator/profile", icon: ClipboardCheck, active: activePath === "/mediator/profile" },
    { label: "เคส", href: "/mediator/cases", icon: FileText, active: activePath === "/mediator/cases" },
    { label: "นัดหมาย", href: "/mediator/appointments", icon: CalendarCheck2, active: activePath === "/mediator/appointments" },
    { label: "Working Hours", href: "/mediator/availability", icon: Clock, active: activePath === "/mediator/availability" },
  ];
}

export async function getAssignedMediatorCases(mediatorProfileId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cases")
    .select("*")
    .eq("selected_mediator_profile_id", mediatorProfileId)
    .order("updated_at", { ascending: false });

  return data ?? [];
}

export async function getApprovedMediatorFeedback(mediatorProfileId: string, limit = 5) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("mediator_reviews")
    .select("*")
    .eq("mediator_id", mediatorProfileId)
    .eq("status", "approved")
    .order("submitted_at", { ascending: false })
    .limit(limit);

  return data ?? [];
}
