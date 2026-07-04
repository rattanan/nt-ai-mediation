import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  FileCheck2,
  FileText,
  Handshake,
  Hourglass,
  PenLine,
  Route,
  ShieldCheck,
  Sparkles,
  UserCheck,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { caseStatusLabels, type MediationCase } from "@/lib/cases";
import { money, type ClosingRecord, type PaymentPlan, type SettlementDocument } from "@/lib/closing";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/appointments";
import type { CaseStatus, Database } from "@/types/database";

type CaseHistory = Database["public"]["Tables"]["case_status_history"]["Row"];
type ClosingWithDetails = (ClosingRecord & {
  settlement_payment_plans?: PaymentPlan[] | null;
  settlement_documents?: SettlementDocument[] | null;
}) | null;

type WorkflowStep = {
  key: string;
  title: string;
  statuses: CaseStatus[];
  estimate: string;
  owner: "debtor" | "system" | "admin" | "creditor" | "mediator";
  icon: typeof FileText;
};

type StepState = "completed" | "current" | "pending" | "failed";

const workflowSteps: WorkflowStep[] = [
  { key: "registration", title: "ลงทะเบียน", statuses: ["draft"], estimate: "เสร็จทันที", owner: "debtor", icon: UserCheck },
  { key: "identity", title: "ยืนยันตัวตน", statuses: ["reviewing", "admin_review", "needs_more_info"], estimate: "ภายใน 1 วันทำการ", owner: "admin", icon: ShieldCheck },
  { key: "submitted", title: "ส่งคำขอ", statuses: ["submitted"], estimate: "เสร็จทันที", owner: "debtor", icon: FileCheck2 },
  { key: "analysis", title: "AI วิเคราะห์เคส", statuses: ["admin_review"], estimate: "ไม่เกิน 1 วันทำการ", owner: "system", icon: Sparkles },
  { key: "creditor", title: "รอเจ้าหนี้", statuses: ["creditor_review", "creditor_accepted", "creditor_rejected"], estimate: "2-5 วันทำการ", owner: "creditor", icon: Hourglass },
  { key: "matching", title: "จับคู่ผู้ไกล่เกลี่ย", statuses: ["mediator_matching", "matched", "mediator_selected"], estimate: "1-2 วันทำการ", owner: "system", icon: Handshake },
  { key: "appointment", title: "นัดหมาย", statuses: ["appointment_scheduling", "scheduled"], estimate: "ตามเวลาที่คู่กรณียืนยัน", owner: "mediator", icon: CalendarClock },
  { key: "session", title: "ประชุมไกล่เกลี่ย", statuses: ["in_mediation"], estimate: "ตามรอบประชุม", owner: "mediator", icon: Route },
  { key: "settlement", title: "ข้อตกลง", statuses: ["settlement_draft", "settled", "not_settled"], estimate: "1-3 วันทำการ", owner: "mediator", icon: FileText },
  { key: "signature", title: "ลงนามดิจิทัล", statuses: ["settled"], estimate: "หลังออกเอกสาร", owner: "debtor", icon: PenLine },
  { key: "repayment", title: "แผนชำระหนี้", statuses: ["settled"], estimate: "ตามแผนชำระ", owner: "debtor", icon: WalletCards },
  { key: "closed", title: "ปิดเคส", statuses: ["closed"], estimate: "เสร็จสิ้น", owner: "system", icon: CheckCircle2 },
];

const failedStatuses: CaseStatus[] = ["creditor_rejected", "not_settled"];

const ownerLabels: Record<WorkflowStep["owner"], string> = {
  debtor: "ผู้ยื่นคำขอ",
  system: "ระบบ NT AI",
  admin: "ทีมตรวจสอบ NT",
  creditor: "เจ้าหนี้",
  mediator: "ผู้ไกล่เกลี่ย",
};

function getCurrentStepIndex(status: CaseStatus) {
  if (status === "closed") return workflowSteps.length - 1;
  if (status === "settled") return workflowSteps.findIndex((step) => step.key === "repayment");
  const index = workflowSteps.findIndex((step) => step.statuses.includes(status));
  return index >= 0 ? index : 0;
}

function getStepState(index: number, currentIndex: number, status: CaseStatus): StepState {
  if (failedStatuses.includes(status) && index === currentIndex) return "failed";
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "pending";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatDate(value: string | null | undefined) {
  if (!value) return "รอกำหนด";
  return new Date(`${value}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysBetween(start: string, end = new Date()) {
  const started = new Date(start).getTime();
  return Math.max(0, Math.floor((end.getTime() - started) / 86400000));
}

function addDays(start: string, days: number) {
  const value = new Date(start);
  value.setDate(value.getDate() + days);
  return value.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
}

function statusDescription(caseItem: MediationCase, currentStep: WorkflowStep) {
  if (caseItem.status === "creditor_rejected") {
    return {
      title: "เจ้าหนี้ปฏิเสธคำขอ",
      description: caseItem.rejection_reason || "เจ้าหนี้ยังไม่สามารถรับคำขอเข้าสู่กระบวนการไกล่เกลี่ยได้",
      action: "ตรวจสอบเหตุผลและติดต่อเจ้าหน้าที่หากต้องการยื่นใหม่",
    };
  }
  if (caseItem.status === "not_settled") {
    return {
      title: "ไกล่เกลี่ยไม่สำเร็จ",
      description: "คู่กรณีไม่สามารถตกลงเงื่อนไขร่วมกันได้ในรอบนี้",
      action: "ดูคำแนะนำและเอกสารสรุปผลการไกล่เกลี่ย",
    };
  }
  if (caseItem.status === "settled" || caseItem.status === "closed") {
    return {
      title: "ไกล่เกลี่ยสำเร็จ",
      description: "ระบบสร้างเอกสารข้อตกลงและแผนดำเนินการหลังไกล่เกลี่ยแล้ว",
      action: "ดาวน์โหลดเอกสารและติดตามแผนชำระหนี้",
    };
  }
  if (caseItem.status === "creditor_review") {
    return {
      title: "รอเจ้าหนี้พิจารณา",
      description: `${caseItem.creditor_name} กำลังตรวจสอบคำขอไกล่เกลี่ยของคุณ`,
      action: "ยังไม่ต้องดำเนินการเพิ่มเติม",
    };
  }
  if (caseItem.status === "appointment_scheduling") {
    return {
      title: "กำลังนัดหมายวันไกล่เกลี่ย",
      description: "ระบบกำลังรอคู่กรณีและผู้ไกล่เกลี่ยยืนยันวันเวลาประชุม",
      action: "ตรวจสอบสถานะนัดหมายและเข้าร่วมตามเวลาที่กำหนด",
    };
  }
  return {
    title: caseStatusLabels[caseItem.status],
    description: `คำขออยู่ในขั้นตอน${currentStep.title} และกำลังดำเนินการโดย${ownerLabels[currentStep.owner]}`,
    action: currentStep.owner === "debtor" ? "ตรวจสอบข้อมูลและดำเนินการตามปุ่มที่แสดงในหน้าเคส" : "ยังไม่ต้องดำเนินการเพิ่มเติม",
  };
}

function nextStepText(currentIndex: number, caseItem: MediationCase) {
  if (failedStatuses.includes(caseItem.status)) return "ระบบจะแสดงเหตุผลและเอกสารสรุป เพื่อให้คุณวางแผนดำเนินการต่อ";
  if (caseItem.status === "closed") return "เคสนี้เสร็จสิ้นแล้ว คุณสามารถดาวน์โหลดเอกสารประกอบได้";
  const next = workflowSteps[currentIndex + 1];
  if (!next) return "ขั้นตอนหลักเสร็จครบแล้ว";
  return `หลังจากขั้นตอนนี้เสร็จ ระบบจะเข้าสู่ขั้นตอน${next.title}`;
}

function RepaymentProgress({ plan }: { plan: PaymentPlan }) {
  const completedInstallments = 0;
  const totalInstallments = Math.max(1, plan.number_of_installments);
  const percent = Math.round((completedInstallments / totalInstallments) * 100);

  return (
    <section className="sticky top-4 z-10 rounded-xl border border-[#D1FAE5] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase text-emerald-700">Repayment Progress</p>
          <h2 className="mt-1 text-2xl font-semibold text-[#111827]">ติดตามแผนชำระหนี้</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{completedInstallments} / {totalInstallments} งวด</p>
        </div>
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <p className="font-semibold">ชำระงวดถัดไป</p>
          <p>{formatDate(plan.first_payment_due_date)} · {money(plan.installment_amount)}</p>
        </div>
      </div>
      <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {Array.from({ length: Math.min(totalInstallments, 12) }).map((_, index) => (
          <div key={index} className={cn("rounded-lg border px-3 py-2 text-sm", index < completedInstallments ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-[#E5E7EB] bg-[#F8FAFC] text-[#6B7280]")}>
            งวดที่ {index + 1}
          </div>
        ))}
      </div>
    </section>
  );
}

function ClosedBanner({ caseItem, closing }: { caseItem: MediationCase; closing: ClosingWithDetails }) {
  if (!closing || closing.result_status !== "settled") return null;
  const discount = closing.settled_amount ? Math.max(0, caseItem.debt_amount - closing.settled_amount) : 0;
  const plan = closing.settlement_payment_plans?.[0];

  return (
    <section className="sticky top-4 z-10 rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Case Successfully Completed
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-[#111827]">เคสไกล่เกลี่ยสำเร็จ</h2>
          <p className="mt-1 text-sm text-[#6B7280]">วันที่สรุปผล {formatDateTime(closing.closed_at)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {closing.settlement_documents?.map((document) => (
            <Button key={document.id} href={`/documents/settlements/${document.id}`} variant="outline" className="rounded-lg">Download Agreement PDF</Button>
          ))}
          <Button type="button" disabled className="rounded-lg">Rate Mediator</Button>
        </div>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-[#F8FAFC] p-3"><dt className="text-xs text-[#6B7280]">ยอดหนี้เดิม</dt><dd className="mt-1 font-semibold">{money(caseItem.debt_amount)}</dd></div>
        <div className="rounded-lg bg-[#F8FAFC] p-3"><dt className="text-xs text-[#6B7280]">ยอดตกลง</dt><dd className="mt-1 font-semibold">{money(closing.settled_amount)}</dd></div>
        <div className="rounded-lg bg-[#F8FAFC] p-3"><dt className="text-xs text-[#6B7280]">ส่วนลด</dt><dd className="mt-1 font-semibold">{money(discount)}</dd></div>
        <div className="rounded-lg bg-[#F8FAFC] p-3"><dt className="text-xs text-[#6B7280]">จำนวนงวด</dt><dd className="mt-1 font-semibold">{plan?.number_of_installments ?? 0} งวด</dd></div>
      </dl>
    </section>
  );
}

function FailedBanner({ caseItem, closing }: { caseItem: MediationCase; closing: ClosingWithDetails }) {
  const reason = closing?.unsuccessful_reason || caseItem.rejection_reason || "ยังไม่มีรายละเอียดเพิ่มเติม";
  return (
    <section className="sticky top-4 z-10 rounded-xl border border-red-200 bg-white p-5 shadow-sm">
      <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
        <AlertTriangle className="h-4 w-4" />
        Case Closed Unsuccessful
      </div>
      <h2 className="mt-3 text-2xl font-semibold text-[#111827]">ไกล่เกลี่ยไม่สำเร็จ</h2>
      <dl className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg bg-[#F8FAFC] p-3 lg:col-span-2"><dt className="text-xs text-[#6B7280]">เหตุผล</dt><dd className="mt-1 font-medium">{reason}</dd></div>
        <div className="rounded-lg bg-[#F8FAFC] p-3"><dt className="text-xs text-[#6B7280]">Platform Fee</dt><dd className="mt-1 font-semibold">ดูใบแจ้งหนี้เมื่อมีการออกเอกสาร</dd></div>
      </dl>
    </section>
  );
}

export function CaseProgressTracker({
  caseItem,
  history,
  appointment,
  closing,
}: {
  caseItem: MediationCase;
  history: CaseHistory[];
  appointment: Appointment | null;
  closing: ClosingWithDetails;
}) {
  const plan = closing?.result_status === "settled" ? closing.settlement_payment_plans?.[0] : null;
  if (caseItem.status === "closed") return <ClosedBanner caseItem={caseItem} closing={closing} />;
  if (caseItem.status === "settled" && plan) return <RepaymentProgress plan={plan} />;
  if (failedStatuses.includes(caseItem.status)) return <FailedBanner caseItem={caseItem} closing={closing} />;

  const currentIndex = getCurrentStepIndex(caseItem.status);
  const currentStep = workflowSteps[currentIndex];
  const completedCount = workflowSteps.filter((_, index) => getStepState(index, currentIndex, caseItem.status) === "completed").length;
  const percent = Math.round((completedCount / (workflowSteps.length - 1)) * 100);
  const statusInfo = statusDescription(caseItem, currentStep);
  const daysOpen = daysBetween(caseItem.created_at);

  return (
    <section className="sticky top-4 z-10 rounded-xl border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-[#A87900]">Case Progress</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#111827]">{percent}% Completed</h2>
            </div>
            <div className="rounded-xl bg-[#FFF8D9] px-4 py-3 text-sm text-[#6B4F00]">
              <p className="font-semibold">Estimated Remaining Time</p>
              <p>{currentStep.estimate}</p>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-[#E5E7EB]">
            <div className="h-full rounded-full bg-[#F5B800] transition-all" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <aside className="rounded-xl border border-black/5 bg-[#F8FAFC] p-4 xl:w-80">
          <h3 className="font-semibold text-[#111827]">Case Summary</h3>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-[#6B7280]">Case Number</dt><dd className="font-semibold">{caseItem.case_number}</dd></div>
            <div><dt className="text-[#6B7280]">Progress</dt><dd className="font-semibold">{percent}%</dd></div>
            <div><dt className="text-[#6B7280]">Current Phase</dt><dd className="font-semibold">{currentStep.title}</dd></div>
            <div><dt className="text-[#6B7280]">Days Open</dt><dd className="font-semibold">{daysOpen} วัน</dd></div>
            <div><dt className="text-[#6B7280]">Creditor</dt><dd className="font-semibold">{caseItem.creditor_name}</dd></div>
            <div><dt className="text-[#6B7280]">Mediator</dt><dd className="font-semibold">{caseItem.selected_mediator_profile_id ? "เลือกแล้ว" : "รอเลือก"}</dd></div>
            <div className="col-span-2"><dt className="text-[#6B7280]">Expected Finish</dt><dd className="font-semibold">{addDays(caseItem.created_at, 30)}</dd></div>
          </dl>
        </aside>
      </div>

      <div className="mt-6 hidden grid-cols-12 gap-2 lg:grid">
        {workflowSteps.map((step, index) => {
          const state = getStepState(index, currentIndex, caseItem.status);
          const Icon = step.icon;
          return (
            <div key={step.key} className="min-w-0">
              <div className={cn("mx-auto flex h-10 w-10 items-center justify-center rounded-full border", state === "completed" && "border-emerald-500 bg-emerald-500 text-white", state === "current" && "animate-pulse border-[#F5B800] bg-[#FFF2A8] text-[#6B4F00]", state === "pending" && "border-[#D1D5DB] bg-[#F3F4F6] text-[#9CA3AF]", state === "failed" && "border-red-500 bg-red-500 text-white")}>
                {state === "completed" ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              </div>
              <p className={cn("mt-2 text-center text-xs font-semibold", state === "pending" ? "text-[#9CA3AF]" : "text-[#111827]")}>{step.title}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 space-y-3 lg:hidden">
        {workflowSteps.map((step, index) => {
          const state = getStepState(index, currentIndex, caseItem.status);
          return (
            <div key={step.key} className="flex gap-3">
              <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", state === "completed" && "border-emerald-500 bg-emerald-500 text-white", state === "current" && "animate-pulse border-[#F5B800] bg-[#FFF2A8] text-[#6B4F00]", state === "pending" && "border-[#D1D5DB] bg-[#F3F4F6] text-[#9CA3AF]", state === "failed" && "border-red-500 bg-red-500 text-white")}>
                {state === "completed" ? <Check className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
              </div>
              <div className="min-w-0 pb-2">
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="text-xs text-[#6B7280]">{ownerLabels[step.owner]} · {step.estimate}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-black/5 bg-[#F8FAFC] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#A87900]"><Clock3 className="h-4 w-4" /> Current Status</div>
          <h3 className="mt-2 text-lg font-semibold">{statusInfo.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[#4B5563]">{statusInfo.description}</p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div><dt className="text-xs text-[#6B7280]">Responsible</dt><dd className="font-semibold">{currentStep.owner === "creditor" ? caseItem.creditor_name : ownerLabels[currentStep.owner]}</dd></div>
            <div><dt className="text-xs text-[#6B7280]">Estimated</dt><dd className="font-semibold">{currentStep.estimate}</dd></div>
          </dl>
          <p className="mt-4 rounded-lg bg-white p-3 text-sm font-medium text-[#374151]">{statusInfo.action}</p>
        </article>
        <article className="rounded-xl border border-black/5 bg-[#F8FAFC] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#A87900]"><Route className="h-4 w-4" /> Next Step</div>
          <h3 className="mt-2 text-lg font-semibold">ขั้นตอนถัดไป</h3>
          <p className="mt-1 text-sm leading-6 text-[#4B5563]">{nextStepText(currentIndex, caseItem)}</p>
          {appointment ? <p className="mt-4 rounded-lg bg-white p-3 text-sm text-[#374151]">มีนัดหมายในระบบแล้ว ตรวจสอบรายละเอียดนัดหมายจากการ์ดด้านล่าง</p> : null}
        </article>
      </div>

      <article className="mt-6 rounded-xl border border-black/5 bg-[#F8FAFC] p-4">
        <h3 className="font-semibold">Timeline History</h3>
        <div className="mt-4 space-y-3">
          {[...history].reverse().map((entry, index) => (
            <div key={entry.id} className="flex gap-3">
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                {index === history.length - 1 ? <Circle className="h-3 w-3 fill-current" /> : <Check className="h-3 w-3" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{caseStatusLabels[entry.to_status]}</p>
                <p className="mt-0.5 text-xs text-[#6B7280]">{formatDateTime(entry.created_at)} · {entry.changed_by ? "ผู้ใช้" : "ระบบ"}</p>
                {entry.note ? <p className="mt-1 text-sm text-[#4B5563]">{entry.note}</p> : null}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
