import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { caseStatusLabels } from "@/lib/cases";
import { getAdminDashboardData, toCsv, type DashboardFilters } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();
  const params = request.nextUrl.searchParams;
  const filters: DashboardFilters = {
    start: params.get("start") ?? undefined,
    end: params.get("end") ?? undefined,
    debtType: params.get("debtType") ?? undefined,
    province: params.get("province") ?? undefined,
    creditor: params.get("creditor") ?? undefined,
    mediator: params.get("mediator") ?? undefined,
    status: (params.get("status") as DashboardFilters["status"]) ?? undefined,
  };
  const data = await getAdminDashboardData(filters);
  const csv = toCsv(data.tables.recentCases.map((item) => ({
    case_number: item.case_number,
    creditor: item.creditor_name,
    debt_type: item.debt_type,
    province: item.province,
    status: caseStatusLabels[item.status],
    debt_amount: item.debt_amount,
    overdue_months: item.overdue_months,
    created_at: item.created_at,
    updated_at: item.updated_at,
  })));

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="nt-ai-mediation-cases-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
