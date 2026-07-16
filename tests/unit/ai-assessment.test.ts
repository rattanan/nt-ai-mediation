import assert from "node:assert/strict";
import test from "node:test";
import { calculateRiskAssessment, createPaymentPlans } from "../../src/lib/ai/assessment.ts";

test("risk score is deterministic and bounded", () => {
  const input = { debtAmount: 120_000, monthlyIncome: 25_000, monthlyExpense: 18_000, affordableMonthlyPayment: 6_000, overdueMonths: 8, incomeStability: "stable" as const, dataCompleteness: 0.9 };
  const first = calculateRiskAssessment(input);
  const second = calculateRiskAssessment(input);
  assert.deepEqual(first, second);
  assert.ok(first.score >= 0 && first.score <= 100);
  assert.equal(first.netCapacity, 6_000);
});

test("payment plans use 70 and 100 percent of net capacity and stay within 120 months", () => {
  const plans = createPaymentPlans({ debtAmount: 100_000, netCapacity: 5_000, annualInterestRate: 0, discountRate: 0 });
  assert.equal(plans.length, 2);
  assert.equal(plans[0].monthlyPayment, 3_500);
  assert.equal(plans[1].monthlyPayment, 5_000);
  assert.ok(plans.every((plan) => plan.termMonths <= 120));
});

test("unpayable plans are not proposed", () => {
  assert.equal(createPaymentPlans({ debtAmount: 1_000_000, netCapacity: 100, annualInterestRate: 15, discountRate: 0 }).length, 0);
});

