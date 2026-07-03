import "server-only";

import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CaseStatus, Database } from "@/types/database";

export type MediationCase = Database["public"]["Tables"]["cases"]["Row"];
export type CaseFormState = {
  error?: string;
};

export const caseStatusLabels: Record<CaseStatus, string> = {
  draft: "แบบร่าง",
  submitted: "ส่งคำขอแล้ว",
  reviewing: "อยู่ระหว่างตรวจสอบ",
  needs_more_info: "ต้องการข้อมูลเพิ่มเติม",
  matched: "จับคู่ผู้ไกล่เกลี่ยแล้ว",
  scheduled: "นัดหมายแล้ว",
  in_mediation: "กำลังไกล่เกลี่ย",
  settled: "ตกลงสำเร็จ",
  not_settled: "ไม่สามารถตกลงได้",
  closed: "ปิดเคส",
};

export function isEditableCase(status: CaseStatus) {
  return status === "draft" || status === "needs_more_info";
}

export function isActiveCase(status: CaseStatus) {
  return ["reviewing", "needs_more_info", "matched", "scheduled", "in_mediation"].includes(status);
}

export function parseCaseForm(formData: FormData) {
  const debtAmount = Number(String(formData.get("debt_amount") ?? "").replaceAll(",", ""));
  const overdueMonths = Number(String(formData.get("overdue_months") ?? "0"));

  const payload = {
    creditor_name: String(formData.get("creditor_name") ?? "").trim(),
    creditor_type: String(formData.get("creditor_type") ?? "").trim(),
    debt_type: String(formData.get("debt_type") ?? "").trim(),
    debt_amount: Number.isFinite(debtAmount) ? debtAmount : -1,
    overdue_months: Number.isFinite(overdueMonths) ? overdueMonths : -1,
    province: String(formData.get("province") ?? "").trim(),
    district: String(formData.get("district") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim(),
    problem_description: String(formData.get("problem_description") ?? "").trim(),
    desired_solution: String(formData.get("desired_solution") ?? "").trim(),
  };

  if (!payload.creditor_name || !payload.creditor_type || !payload.debt_type) {
    return { error: "กรุณากรอกข้อมูลเจ้าหนี้และประเภทหนี้ให้ครบถ้วน", payload };
  }

  if (payload.debt_amount < 0 || payload.overdue_months < 0) {
    return { error: "กรุณากรอกยอดหนี้และจำนวนเดือนค้างชำระให้ถูกต้อง", payload };
  }

  if (!payload.province || !payload.district || !payload.contact_phone) {
    return { error: "กรุณากรอกจังหวัด อำเภอ และเบอร์ติดต่อให้ครบถ้วน", payload };
  }

  if (payload.problem_description.length < 20) {
    return { error: "กรุณาอธิบายปัญหาอย่างน้อย 20 ตัวอักษร", payload };
  }

  if (payload.desired_solution.length < 10) {
    return { error: "กรุณาระบุแนวทางที่ต้องการอย่างน้อย 10 ตัวอักษร", payload };
  }

  return { payload };
}

export async function getDebtorCases(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("debtor_user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return data ?? [];
}

export async function getCaseForDebtor(caseId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("debtor_user_id", userId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  return data;
}

export async function getCaseHistory(caseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("case_status_history")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false });

  return data ?? [];
}

export function redirectToCase(caseId: string): never {
  redirect(`/debtor/cases/${caseId}`);
}
