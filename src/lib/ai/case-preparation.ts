import "server-only";

import { calculateRiskAssessment, createPaymentPlans } from "@/lib/ai/assessment";
import { requestStructuredAi, stringArray } from "@/lib/ai/client";
import { processDocumentOcr } from "@/lib/ai/document-ocr";
import { hasReachedOcrRetryLimit } from "@/lib/ai/ocr-retry";
import {
  interviewTranscript,
  isRepeatedInterviewQuestion,
  MAX_AI_INTERVIEW_QUESTIONS,
} from "@/lib/ai/interview";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type CaseRow = Database["public"]["Tables"]["cases"]["Row"];

function numberValue(value: unknown) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function caseContext(
  caseItem: CaseRow,
  ocrText: string,
  transcript: Array<{ question: string; answer: string | null }>,
  questionCount: number,
) {
  return JSON.stringify({
    debt: { type: caseItem.debt_type, amount: caseItem.debt_amount, overdue_months: caseItem.overdue_months },
    finances: { monthly_income: caseItem.monthly_income, monthly_expense: caseItem.monthly_expense, affordable_payment: caseItem.affordable_monthly_payment },
    problem: caseItem.problem_description,
    desired_solution: caseItem.desired_solution,
    ocr_text: ocrText.slice(0, 80_000),
    interview_transcript: transcript,
    asked_questions: transcript.map((item) => item.question),
    remaining_question_slots: Math.max(0, MAX_AI_INTERVIEW_QUESTIONS - questionCount),
  });
}

export async function initializeCasePreparation(caseId: string) {
  const admin = createAdminClient();
  const { data: caseItem, error } = await admin.from("cases").select("*").eq("id", caseId).single();
  if (error || !caseItem) throw new Error("Case not found");
  const { data: session } = await admin.from("case_ai_sessions").upsert({ case_id: caseId, status: "processing" }, { onConflict: "case_id" }).select("*").single();
  if (!session) throw new Error("Could not create AI session");

  const { data: documents } = await admin.from("case_documents").select("*").eq("case_id", caseId).order("created_at");
  const ocrTexts: string[] = [];
  for (const document of documents ?? []) {
    if (document.ocr_status === "completed" && document.ocr_text) {
      ocrTexts.push(document.ocr_text);
      continue;
    }
    if (hasReachedOcrRetryLimit(document.retry_count)) continue;
    await admin.from("case_documents").update({ ocr_status: "processing", last_error: null }).eq("id", document.id);
    try {
      const { data: file, error: downloadError } = await admin.storage.from("case-documents").download(document.storage_path);
      if (downloadError || !file) throw downloadError ?? new Error("Document download failed");
      const ocr = await processDocumentOcr(new Uint8Array(await file.arrayBuffer()), document.mime_type || "application/pdf");
      ocrTexts.push(ocr.text);
      await admin.from("case_documents").update({ ocr_status: "completed", ocr_text: ocr.text, page_count: ocr.pageCount, ocr_confidence: ocr.confidence, processed_at: new Date().toISOString() }).eq("id", document.id);
    } catch (ocrError) {
      const attempts = document.retry_count + 1;
      await admin.from("case_documents").update({ ocr_status: "failed", retry_count: attempts, last_error: ocrError instanceof Error ? ocrError.message : "OCR failed" }).eq("id", document.id);
      if (!hasReachedOcrRetryLimit(attempts)) throw new Error("OCR processing is incomplete");
    }
  }

  const { data: messages } = await admin.from("case_ai_messages").select("role, content, sequence").eq("case_id", caseId).order("sequence");
  const transcript = interviewTranscript(messages ?? []);
  const askedQuestions = transcript.map((item) => item.question);
  const hasUnansweredQuestion = transcript.at(-1)?.answer === null;
  if (hasUnansweredQuestion) {
    await admin.from("case_ai_sessions").update({ status: "interview" }).eq("id", session.id);
    return;
  }

  const context = caseContext(caseItem, ocrTexts.join("\n\n"), transcript, askedQuestions.length);
  const { data, model } = await requestStructuredAi([
    {
      role: "system",
      content: [
        "คุณเป็นผู้ช่วยเตรียมเคสไกล่เกลี่ยหนี้ภาษาไทย ใช้เฉพาะข้อมูลที่ให้และห้ามเดาข้อมูลที่ไม่ทราบ",
        "ตอบ JSON: summary string, strengths string[], benefits string[], missing_fields string[], next_question string|null",
        `การสัมภาษณ์มีได้สูงสุด ${MAX_AI_INTERVIEW_QUESTIONS} คำถามรวมทั้งหมด`,
        "พิจารณาข้อมูลจากแบบฟอร์ม OCR และ interview_transcript ก่อนถามทุกครั้ง",
        "ห้ามถามซ้ำหรือถามใหม่ในประเด็นที่มีข้อมูลเพียงพอแล้ว แม้จะเปลี่ยนถ้อยคำ",
        "ถ้าจำเป็น ให้ถามเพียงหนึ่งคำถามที่สำคัญที่สุดต่อการประเมินความสามารถชำระหนี้หรือข้อเสนอไกล่เกลี่ย",
        "อย่าถามรายละเอียดที่มีผลน้อย หากไม่มีประเด็นสำคัญใหม่ หรือ remaining_question_slots เป็น 0 ให้ next_question เป็น null",
      ].join("\n"),
    },
    { role: "user", content: context },
  ]);
  const nextQuestion = typeof data.next_question === "string" ? data.next_question.trim() : "";
  const shouldInterview = Boolean(nextQuestion)
    && askedQuestions.length < MAX_AI_INTERVIEW_QUESTIONS
    && !isRepeatedInterviewQuestion(nextQuestion, askedQuestions);
  const updates = {
    status: shouldInterview ? "interview" as const : "ready" as const,
    summary: String(data.summary ?? ""),
    strengths: stringArray(data.strengths) as Json,
    benefits: stringArray(data.benefits) as Json,
    missing_fields: stringArray(data.missing_fields) as Json,
  };
  await admin.from("case_ai_sessions").update(updates).eq("id", session.id);

  if (shouldInterview) {
    const sequence = (messages?.at(-1)?.sequence ?? -1) + 1;
    await admin.from("case_ai_messages").insert({ session_id: session.id, case_id: caseId, role: "assistant", content: nextQuestion, sequence, metadata: { model } });
  } else {
    await generateCaseAssessment(caseItem, session.id, updates.summary, updates.strengths, updates.benefits, stringArray(data.missing_fields).length, model);
  }
}

async function generateCaseAssessment(caseItem: CaseRow, sessionId: string, summary: string, strengths: Json, benefits: Json, missingCount: number, model: string) {
  const admin = createAdminClient();
  const completeness = Math.max(0, 1 - missingCount / 10);
  const risk = calculateRiskAssessment({ debtAmount: numberValue(caseItem.debt_amount), monthlyIncome: numberValue(caseItem.monthly_income), monthlyExpense: numberValue(caseItem.monthly_expense), affordableMonthlyPayment: caseItem.affordable_monthly_payment, overdueMonths: caseItem.overdue_months, incomeStability: caseItem.monthly_income ? "stable" : "unknown", dataCompleteness: completeness });
  const { data: explanation } = await requestStructuredAi([
    { role: "system", content: "อธิบายผลประเมินไกล่เกลี่ยโดยไม่เปลี่ยนคะแนนที่ระบบคำนวณ ตอบ JSON: rationale string, risks string[]" },
    { role: "user", content: JSON.stringify({ summary, score: risk.score, factors: risk.factors }) },
  ]);
  const { data: existing } = await admin.from("case_ai_assessments").select("version").eq("case_id", caseItem.id).order("version", { ascending: false }).limit(1).maybeSingle();
  const { data: assessment, error } = await admin.from("case_ai_assessments").insert({ case_id: caseItem.id, session_id: sessionId, version: (existing?.version ?? 0) + 1, risk_score: risk.score, risk_level: risk.level, factors: risk.factors as Json, risks: stringArray(explanation.risks) as Json, strengths, benefits, rationale: String(explanation.rationale ?? ""), model }).select("id").single();
  if (error || !assessment) throw new Error("Could not save assessment");
  const { data: policy } = await admin.from("ai_rate_policies").select("*").in("debt_type", [caseItem.debt_type, "*"]).eq("active", true).order("debt_type", { ascending: false }).limit(1).maybeSingle();
  const interest = policy ? (policy.min_interest_rate + policy.max_interest_rate) / 2 : 0;
  const discount = policy ? (policy.min_discount_rate + policy.max_discount_rate) / 2 : 0;
  const plans = createPaymentPlans({ debtAmount: numberValue(caseItem.debt_amount), netCapacity: risk.netCapacity, annualInterestRate: interest, discountRate: discount });
  if (plans.length) await admin.from("case_payment_plans").insert(plans.map((plan) => ({ case_id: caseItem.id, assessment_id: assessment.id, plan_type: plan.planType, principal_amount: plan.principalAmount, monthly_payment: plan.monthlyPayment, term_months: plan.termMonths, total_payment: plan.totalPayment, assumed_interest_rate: plan.assumedInterestRate, assumed_discount_rate: plan.assumedDiscountRate, assumptions: { capacity_ratio: plan.planType === "light_payment" ? 0.7 : 1 } })));
  await admin.from("case_ai_sessions").update(plans.length === 2 ? { status: "ready" } : { status: "manual_bypass", bypass_reason: "No feasible payment plans within 120 months", completed_at: new Date().toISOString() }).eq("id", sessionId);
}

export async function answerCaseInterview(caseId: string, answer: string) {
  const admin = createAdminClient();
  const { data: session } = await admin.from("case_ai_sessions").select("*").eq("case_id", caseId).single();
  if (!session || session.status !== "interview" || session.question_count >= MAX_AI_INTERVIEW_QUESTIONS) throw new Error("Interview is not active");
  const { data: last } = await admin.from("case_ai_messages").select("sequence").eq("session_id", session.id).order("sequence", { ascending: false }).limit(1).maybeSingle();
  await admin.from("case_ai_messages").insert({ session_id: session.id, case_id: caseId, role: "user", content: answer || "ไม่ทราบ", sequence: (last?.sequence ?? -1) + 1 });
  await admin.from("case_ai_sessions").update({ question_count: session.question_count + 1, status: "processing" }).eq("id", session.id);
  await initializeCasePreparation(caseId);
}
