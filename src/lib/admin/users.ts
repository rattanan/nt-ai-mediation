import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, Database } from "@/types/database";

export type AccountStatus = Database["public"]["Tables"]["profiles"]["Row"]["account_status"];
export type AdminUserProfile = Database["public"]["Tables"]["profiles"]["Row"];

export const adminRoleOptions: Array<{ value: AppRole; label: string }> = [
  { value: "admin", label: "ผู้ดูแลระบบ" },
  { value: "debtor", label: "ลูกหนี้" },
  { value: "mediator", label: "ผู้ไกล่เกลี่ย" },
  { value: "creditor", label: "เจ้าหนี้" },
];

export const accountStatusOptions: Array<{ value: AccountStatus; label: string }> = [
  { value: "active", label: "ใช้งานได้" },
  { value: "pending_verification", label: "รอยืนยันอีเมล" },
  { value: "suspended", label: "ระงับชั่วคราว" },
  { value: "disabled", label: "ปิดใช้งาน" },
];

export async function listAdminUsers({
  query,
  role,
  limit = 50,
}: {
  query?: string;
  role?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let request = supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (role && adminRoleOptions.some((option) => option.value === role)) {
    request = request.eq("role", role as AppRole);
  }

  if (query?.trim()) {
    const escaped = query.trim().replaceAll("%", "\\%").replaceAll("_", "\\_");
    request = request.or(
      `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,organization_name.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await request;

  if (error) {
    return { users: [] as AdminUserProfile[], error: error.message };
  }

  return { users: data ?? [], error: null };
}

export async function getAdminUser(userId?: string) {
  if (!userId) return null;

  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();

  return data;
}
