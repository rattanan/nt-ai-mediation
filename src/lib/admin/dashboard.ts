import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, CaseStatus, Database } from "@/types/database";

export type DashboardFilters = {
  start?: string;
  end?: string;
  debtType?: string;
  province?: string;
  creditor?: string;
  mediator?: string;
  status?: CaseStatus | "";
};

type CaseRow = Database["public"]["Tables"]["cases"]["Row"];

export const statusGroups = {
  active: ["creditor_review", "creditor_accepted", "mediator_matching", "matched", "mediator_selected", "appointment_scheduling", "scheduled", "in_mediation", "settlement_draft"] as CaseStatus[],
  successful: ["settled", "closed"] as CaseStatus[],
  failed: ["not_settled", "creditor_rejected"] as CaseStatus[],
};

function moneySum<T>(rows: T[], pick: (row: T) => number | null | undefined) {
  return rows.reduce((sum, row) => sum + Number(pick(row) ?? 0), 0);
}

function dateKey(value: string) {
  return value.slice(0, 7);
}

function daysOpen(item: Pick<CaseRow, "created_at">) {
  return Math.max(0, Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000));
}

function groupCount<T>(rows: T[], key: (row: T) => string | null | undefined) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = key(row) || "ไม่ระบุ";
    map.set(value, (map.get(value) ?? 0) + 1);
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function groupAmount<T>(rows: T[], key: (row: T) => string | null | undefined, amount: (row: T) => number | null | undefined) {
  const map = new Map<string, number>();
  for (const row of rows) {
    const value = key(row) || "ไม่ระบุ";
    map.set(value, (map.get(value) ?? 0) + Number(amount(row) ?? 0));
  }
  return [...map.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

function applyFilters(cases: CaseRow[], filters: DashboardFilters) {
  return cases.filter((item) => {
    if (filters.start && item.created_at < `${filters.start}T00:00:00.000Z`) return false;
    if (filters.end && item.created_at > `${filters.end}T23:59:59.999Z`) return false;
    if (filters.debtType && item.debt_type !== filters.debtType) return false;
    if (filters.province && item.province !== filters.province) return false;
    if (filters.creditor && item.creditor_organization_id !== filters.creditor) return false;
    if (filters.mediator && item.selected_mediator_profile_id !== filters.mediator) return false;
    if (filters.status && item.status !== filters.status) return false;
    return true;
  });
}

export async function getAdminDashboardData(filters: DashboardFilters = {}) {
  const supabase = await createClient();
  const [
    profilesResult,
    casesResult,
    appointmentsResult,
    closingsResult,
    invoicesResult,
    mediatorsResult,
    trustScoresResult,
    creditorsResult,
    reviewsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("cases").select("*").order("created_at", { ascending: false }),
    supabase.from("mediation_appointments").select("*"),
    supabase.from("mediation_closing_records").select("*"),
    supabase.from("billing_invoices").select("*"),
    supabase.from("mediator_profiles").select("*"),
    supabase.from("mediator_trust_scores").select("*"),
    supabase.from("creditor_organizations").select("*"),
    supabase.from("mediator_reviews").select("*"),
  ]);

  const profiles = profilesResult.data ?? [];
  const allCases = casesResult.data ?? [];
  const cases = applyFilters(allCases, filters);
  const caseIds = new Set(cases.map((item) => item.id));
  const appointments = (appointmentsResult.data ?? []).filter((item) => caseIds.has(item.case_id));
  const closings = (closingsResult.data ?? []).filter((item) => caseIds.has(item.case_id));
  const invoices = (invoicesResult.data ?? []).filter((item) => caseIds.has(item.case_id));
  const mediators = mediatorsResult.data ?? [];
  const trustScores = trustScoresResult.data ?? [];
  const creditors = creditorsResult.data ?? [];
  const reviews = reviewsResult.data ?? [];

  const successfulCases = cases.filter((item) => statusGroups.successful.includes(item.status));
  const failedCases = cases.filter((item) => statusGroups.failed.includes(item.status));
  const activeCases = cases.filter((item) => statusGroups.active.includes(item.status));
  const today = new Date().toISOString().slice(0, 10);
  const newToday = cases.filter((item) => item.created_at.slice(0, 10) === today);
  const totalDebt = moneySum(cases, (item) => item.debt_amount);
  const settledDebt = moneySum(closings, (item) => item.settled_amount);
  const platformFee = moneySum(invoices, (item) => item.platform_fee_amount);
  const successFee = moneySum(invoices, (item) => item.success_fee_amount);
  const successRate = closings.length > 0 ? Math.round((closings.filter((item) => item.result_status === "settled").length / closings.length) * 100) : 0;
  const roleCounts = (["debtor", "mediator", "creditor"] as AppRole[]).map((role) => ({ role, count: profiles.filter((item) => item.role === role).length }));
  const trustByMediator = new Map(trustScores.map((item) => [item.mediator_id, item]));

  const monthlyCases = groupCount(cases, (item) => dateKey(item.created_at)).slice(0, 12).reverse();
  const monthlyRevenue = [...new Set(invoices.map((item) => dateKey(item.issued_at)))].sort().map((month) => ({
    label: month,
    platformFee: moneySum(invoices.filter((item) => dateKey(item.issued_at) === month), (item) => item.platform_fee_amount),
    successFee: moneySum(invoices.filter((item) => dateKey(item.issued_at) === month), (item) => item.success_fee_amount),
  }));
  const aging = [
    { label: "0-7 วัน", value: cases.filter((item) => daysOpen(item) <= 7).length },
    { label: "8-15 วัน", value: cases.filter((item) => daysOpen(item) >= 8 && daysOpen(item) <= 15).length },
    { label: "16-30 วัน", value: cases.filter((item) => daysOpen(item) >= 16 && daysOpen(item) <= 30).length },
    { label: "31+ วัน", value: cases.filter((item) => daysOpen(item) >= 31).length },
  ];

  const topMediators = mediators
    .map((mediator) => {
      const assigned = cases.filter((item) => item.selected_mediator_profile_id === mediator.id);
      const score = trustByMediator.get(mediator.id);
      return {
        id: mediator.id,
        name: `${mediator.title ?? ""} ${mediator.first_name} ${mediator.last_name}`.trim(),
        province: mediator.province ?? "-",
        cases: assigned.length,
        score: score?.overall_score ?? 0,
        rating: score?.average_rating ?? 0,
        successful: assigned.filter((item) => statusGroups.successful.includes(item.status)).length,
      };
    })
    .sort((a, b) => b.score - a.score || b.successful - a.successful)
    .slice(0, 8);

  const topCreditors = creditors
    .map((creditor) => {
      const rows = cases.filter((item) => item.creditor_organization_id === creditor.id);
      return {
        id: creditor.id,
        name: creditor.organization_name,
        cases: rows.length,
        debt: moneySum(rows, (item) => item.debt_amount),
        settled: moneySum(closings.filter((item) => item.creditor_organization_id === creditor.id), (item) => item.settled_amount),
      };
    })
    .sort((a, b) => b.cases - a.cases)
    .slice(0, 8);

  return {
    kpis: {
      totalCases: cases.length,
      newToday: newToday.length,
      activeCases: activeCases.length,
      successfulCases: successfulCases.length,
      failedCases: failedCases.length,
      successRate,
      totalDebt,
      settledDebt,
      platformFee,
      successFee,
      totalRevenue: platformFee + successFee,
      readyMediators: mediators.filter((item) => item.status === "approved").length,
      creditors: creditors.filter((item) => item.status === "approved").length,
      debtors: profiles.filter((item) => item.role === "debtor").length,
    },
    filters: {
      debtTypes: [...new Set(allCases.map((item) => item.debt_type))].sort(),
      provinces: [...new Set(allCases.map((item) => item.province))].sort(),
      creditors,
      mediators,
    },
    charts: {
      monthlyCases,
      statusCounts: groupCount(cases, (item) => item.status),
      debtByType: groupAmount(cases, (item) => item.debt_type, (item) => item.debt_amount),
      provinceCounts: groupCount(cases, (item) => item.province).slice(0, 10),
      aging,
      monthlyRevenue,
      successBreakdown: [
        { label: "สำเร็จ", value: successfulCases.length },
        { label: "ไม่สำเร็จ", value: failedCases.length },
        { label: "กำลังดำเนินการ", value: activeCases.length },
      ],
    },
    tables: {
      recentCases: cases.slice(0, 10),
      allCases: cases,
      slaCases: cases.filter((item) => statusGroups.active.includes(item.status) && daysOpen(item) >= 14).sort((a, b) => daysOpen(b) - daysOpen(a)).slice(0, 10),
      highRiskCases: cases.filter((item) => item.debt_amount >= 500000 || item.overdue_months >= 12).slice(0, 10),
      topMediators,
      topCreditors,
      pendingReviewCount: reviews.filter((item) => item.status === "pending").length,
      appointments,
      invoices,
      closings,
      mediators,
      creditors,
      profiles,
      reviews,
      trustScores,
    },
    roleCounts,
  };
}

export async function getOverviewDashboardData(filters: DashboardFilters = {}) {
  return getAdminDashboardData(filters);
}

export async function getCaseDashboardData(filters: DashboardFilters = {}) {
  const data = await getAdminDashboardData(filters);
  const cases = data.tables.allCases;
  return {
    ...data,
    cases,
    waitingForMediator: cases.filter((item) => ["mediator_matching", "matched"].includes(item.status)),
    waitingForAppointment: cases.filter((item) => item.status === "appointment_scheduling"),
    waitingForSettlement: cases.filter((item) => item.status === "settlement_draft"),
  };
}

export async function getFinancialDashboardData(filters: DashboardFilters = {}) {
  const data = await getAdminDashboardData(filters);
  const invoices = data.tables.invoices;
  return {
    ...data,
    unpaidInvoices: invoices.filter((item) => item.status !== "paid" && item.status !== "cancelled"),
    outstandingInvoiceAmount: moneySum(invoices.filter((item) => item.status !== "paid" && item.status !== "cancelled"), (item) => item.total_amount),
  };
}

export async function getMediatorDashboardData(filters: DashboardFilters = {}) {
  const data = await getAdminDashboardData(filters);
  const mediators = data.tables.mediators;
  const trustScores = data.tables.trustScores;
  const approved = mediators.filter((item) => item.status === "approved");
  const scoreByMediator = new Map(trustScores.map((item) => [item.mediator_id, item]));
  const mediatorRows = mediators.map((mediator) => {
    const score = scoreByMediator.get(mediator.id);
    const cases = data.tables.allCases.filter((item) => item.selected_mediator_profile_id === mediator.id);
    return {
      id: mediator.id,
      name: `${mediator.title ?? ""} ${mediator.first_name} ${mediator.last_name}`.trim(),
      province: mediator.province ?? "-",
      status: mediator.status,
      cases: cases.length,
      activeCases: cases.filter((item) => statusGroups.active.includes(item.status)).length,
      successRate: cases.length ? Math.round((cases.filter((item) => statusGroups.successful.includes(item.status)).length / cases.length) * 100) : 0,
      score: score?.overall_score ?? 0,
      rating: score?.average_rating ?? 0,
      completedCases: score?.completed_cases ?? 0,
    };
  });

  return {
    ...data,
    approvedMediators: approved,
    availableMediators: approved.filter((item) => item.online_mediation_available || item.onsite_mediation_available),
    activeMediators: mediatorRows.filter((item) => item.activeCases > 0),
    averageTrustScore: trustScores.length ? Math.round(moneySum(trustScores, (item) => item.overall_score) / trustScores.length) : 0,
    averageRating: trustScores.length ? moneySum(trustScores, (item) => item.average_rating) / trustScores.length : 0,
    mediatorRows,
  };
}

export async function getCreditorDashboardData(filters: DashboardFilters = {}) {
  const data = await getAdminDashboardData(filters);
  const creditorRows = data.tables.creditors.map((creditor) => {
    const cases = data.tables.allCases.filter((item) => item.creditor_organization_id === creditor.id);
    const settled = data.tables.closings.filter((item) => item.creditor_organization_id === creditor.id);
    const revenue = data.tables.invoices.filter((item) => item.creditor_organization_id === creditor.id);
    const totalDebt = moneySum(cases, (item) => item.debt_amount);
    const settledAmount = moneySum(settled, (item) => item.settled_amount);
    return {
      id: creditor.id,
      name: creditor.organization_name,
      status: creditor.status,
      type: creditor.organization_type,
      cases: cases.length,
      failedCases: cases.filter((item) => statusGroups.failed.includes(item.status)).length,
      debt: totalDebt,
      settled: settledAmount,
      recoveryRate: totalDebt ? Math.round((settledAmount / totalDebt) * 100) : 0,
      revenue: moneySum(revenue, (item) => item.total_amount),
    };
  });
  return { ...data, creditorRows };
}

export async function getDebtorDashboardData(filters: DashboardFilters = {}) {
  const data = await getAdminDashboardData(filters);
  const debtors = data.tables.profiles.filter((item) => item.role === "debtor");
  const month = new Date().toISOString().slice(0, 7);
  const debtorIdsWithCases = new Set(data.tables.allCases.map((item) => item.debtor_user_id));
  const settlementDebtorIds = new Set(data.tables.allCases.filter((item) => statusGroups.successful.includes(item.status)).map((item) => item.debtor_user_id));
  return {
    ...data,
    debtors,
    newDebtorsThisMonth: debtors.filter((item) => item.created_at.slice(0, 7) === month),
    debtorsWithActiveCases: debtors.filter((item) => debtorIdsWithCases.has(item.id)),
    debtorsWithSettlementPlans: debtors.filter((item) => settlementDebtorIds.has(item.id)),
  };
}

export async function getSlaRiskDashboardData(filters: DashboardFilters = {}) {
  const data = await getAdminDashboardData(filters);
  const activeCases = data.tables.allCases.filter((item) => statusGroups.active.includes(item.status));
  const overdueCases = activeCases.filter((item) => daysOpen(item) >= 30);
  const nearBreachCases = activeCases.filter((item) => daysOpen(item) >= 14 && daysOpen(item) < 30);
  const highRiskCases = data.tables.highRiskCases;
  return {
    ...data,
    nearBreachCases,
    overdueCases,
    highRiskCases,
    averageCaseAge: activeCases.length ? Math.round(activeCases.reduce((sum, item) => sum + daysOpen(item), 0) / activeCases.length) : 0,
    priorityDistribution: [
      { label: "Critical", value: highRiskCases.filter((item) => item.debt_amount >= 1000000 || item.overdue_months >= 18).length },
      { label: "High", value: highRiskCases.length },
      { label: "Normal", value: Math.max(0, activeCases.length - highRiskCases.length) },
    ],
  };
}

export async function getReviewsTrustScoreDashboardData(filters: DashboardFilters = {}) {
  const data = await getAdminDashboardData(filters);
  const reviews = data.tables.reviews;
  const approvedReviews = reviews.filter((item) => item.status === "approved");
  const pendingReviews = reviews.filter((item) => item.status === "pending");
  const complaintReviews = reviews.filter((item) => item.rating <= 2);
  return {
    ...data,
    approvedReviews,
    pendingReviews,
    complaintReviews,
    averageRating: reviews.length ? moneySum(reviews, (item) => item.rating) / reviews.length : 0,
    averageTrustScore: data.tables.trustScores.length ? Math.round(moneySum(data.tables.trustScores, (item) => item.overall_score) / data.tables.trustScores.length) : 0,
  };
}

export function toCsv(rows: Record<string, string | number | null | undefined>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: string | number | null | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\n");
}
