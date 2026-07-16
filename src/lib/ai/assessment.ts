export type CaseFinancialInput = {
  debtAmount: number;
  monthlyIncome: number;
  monthlyExpense: number;
  affordableMonthlyPayment?: number | null;
  overdueMonths: number;
  incomeStability: "stable" | "variable" | "unknown";
  dataCompleteness: number;
};

export type RiskAssessment = {
  score: number;
  level: "low" | "medium" | "high";
  netCapacity: number;
  factors: Record<string, number | string>;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function calculateRiskAssessment(input: CaseFinancialInput): RiskAssessment {
  const income = Math.max(0, input.monthlyIncome);
  const expense = Math.max(0, input.monthlyExpense);
  const netCapacity = Math.max(0, input.affordableMonthlyPayment ?? income - expense);
  const monthlyDebtReference = Math.max(1, input.debtAmount / 60);
  const repaymentRisk = 1 - clamp(netCapacity / monthlyDebtReference, 0, 1);
  const debtToIncome = income > 0 ? input.debtAmount / (income * 12) : 10;
  const dtiRisk = clamp(debtToIncome / 5, 0, 1);
  const overdueRisk = clamp(input.overdueMonths / 36, 0, 1);
  const stabilityRisk = input.incomeStability === "stable" ? 0.15 : input.incomeStability === "variable" ? 0.65 : 0.85;
  const completenessRisk = 1 - clamp(input.dataCompleteness, 0, 1);
  const score = Math.round(100 * (repaymentRisk * 0.35 + dtiRisk * 0.25 + overdueRisk * 0.15 + stabilityRisk * 0.15 + completenessRisk * 0.10));

  return {
    score,
    level: score < 35 ? "low" : score < 70 ? "medium" : "high",
    netCapacity,
    factors: {
      repayment_capacity: Math.round(repaymentRisk * 100),
      debt_to_income: Math.round(dtiRisk * 100),
      overdue_period: Math.round(overdueRisk * 100),
      income_stability: Math.round(stabilityRisk * 100),
      data_completeness: Math.round(completenessRisk * 100),
    },
  };
}

export function createPaymentPlans(input: {
  debtAmount: number;
  netCapacity: number;
  annualInterestRate: number;
  discountRate: number;
}) {
  if (input.netCapacity <= 0 || input.debtAmount <= 0) return [];
  const discountedPrincipal = Math.max(0, input.debtAmount * (1 - clamp(input.discountRate, 0, 100) / 100));
  const monthlyRate = Math.max(0, input.annualInterestRate) / 1200;

  const makePlan = (planType: "light_payment" | "fast_close", capacityRatio: number) => {
    const target = Math.max(1, input.netCapacity * capacityRatio);
    let balance = discountedPrincipal;
    let termMonths = 0;
    let totalPayment = 0;
    while (balance > 0.01 && termMonths < 120) {
      const interest = balance * monthlyRate;
      const payment = Math.min(balance + interest, target);
      if (payment <= interest) break;
      balance = balance + interest - payment;
      totalPayment += payment;
      termMonths += 1;
    }
    if (balance > 0.01 || termMonths === 0) return null;
    return {
      planType,
      principalAmount: discountedPrincipal,
      monthlyPayment: Math.round(target * 100) / 100,
      termMonths,
      totalPayment: Math.round(totalPayment * 100) / 100,
      assumedInterestRate: input.annualInterestRate,
      assumedDiscountRate: input.discountRate,
    };
  };

  return [makePlan("light_payment", 0.7), makePlan("fast_close", 1)].filter((plan): plan is NonNullable<typeof plan> => Boolean(plan));
}
