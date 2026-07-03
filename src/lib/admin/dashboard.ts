import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/types/database";

async function safeCount(table: "profiles" | "cases" | "mediation_sessions" | "settlement_agreements", filter?: { column: string; value: string }) {
  const supabase = await createClient();
  let query = supabase.from(table).select("*", { count: "exact", head: true });

  if (filter) {
    query = query.eq(filter.column, filter.value);
  }

  const { count } = await query;
  return count ?? 0;
}

export async function getAdminDashboardData() {
  const supabase = await createClient();
  const roles: AppRole[] = ["debtor", "mediator", "creditor"];

  const [
    totalUsers,
    totalCases,
    pendingCases,
    scheduledAppointments,
    completedSettlements,
    recentUsersResult,
    recentCasesResult,
  ] = await Promise.all([
    safeCount("profiles"),
    safeCount("cases"),
    safeCount("cases", { column: "status", value: "submitted" }),
    safeCount("mediation_sessions", { column: "status", value: "scheduled" }),
    safeCount("settlement_agreements", { column: "status", value: "completed" }),
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5),
    supabase.from("cases").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const roleCounts = await Promise.all(
    roles.map(async (role) => ({
      role,
      count: await safeCount("profiles", { column: "role", value: role }),
    })),
  );

  const statusValues = ["draft", "submitted", "reviewing", "needs_more_info", "matched", "scheduled", "in_mediation", "settled", "closed"];
  const caseStatusCounts = await Promise.all(
    statusValues.map(async (status) => ({
      status,
      count: await safeCount("cases", { column: "status", value: status }),
    })),
  );

  return {
    totalUsers,
    totalDebtors: roleCounts.find((item) => item.role === "debtor")?.count ?? 0,
    totalMediators: roleCounts.find((item) => item.role === "mediator")?.count ?? 0,
    totalCreditors: roleCounts.find((item) => item.role === "creditor")?.count ?? 0,
    totalCases,
    pendingCases,
    scheduledAppointments,
    completedSettlements,
    recentUsers: recentUsersResult.data ?? [],
    recentCases: recentCasesResult.data ?? [],
    roleCounts,
    caseStatusCounts,
  };
}
