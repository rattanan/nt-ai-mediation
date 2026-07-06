"use client";

import { useActionState } from "react";
import type { MediationCase, CaseFormState } from "@/lib/cases";
import { emptyFormState } from "@/lib/form-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { CaseLocationFields } from "@/components/debtor/case-location-fields";
import { CaseFormSubmit } from "@/components/debtor/case-form-submit";

function documentLabel(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "name" in value && typeof value.name === "string") {
    return value.name;
  }
  return "";
}

function getValue(state: CaseFormState, defaultCase: MediationCase | undefined, name: keyof MediationCase | string, fallback = "") {
  return state.values?.[String(name)] ?? String(defaultCase?.[name as keyof MediationCase] ?? fallback);
}

export function CaseForm({
  action,
  submitLabel,
  defaultCase,
  campaignSummary,
}: {
  action: (state: CaseFormState, formData: FormData) => Promise<CaseFormState>;
  submitLabel: string;
  defaultCase?: MediationCase;
  campaignSummary?: {
    organizationId: string;
    campaignId: string;
    organizationName: string;
    campaignTitle: string;
    campaignDescription?: string | null;
    debtType?: string | null;
  };
}) {
  const [state, formAction] = useActionState(action, emptyFormState);
  const existingDocuments = Array.isArray(defaultCase?.uploaded_documents) ? defaultCase.uploaded_documents : [];
  const creditorName = state.values?.creditor_name ?? defaultCase?.creditor_name ?? campaignSummary?.organizationName ?? "";
  const debtType = state.values?.debt_type ?? defaultCase?.debt_type ?? campaignSummary?.debtType ?? "";
  const province = state.values?.province ?? defaultCase?.province ?? "";
  const district = state.values?.district ?? defaultCase?.district ?? "";

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? <Alert variant="destructive">{state.error}</Alert> : null}
      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#A87900]">ขั้นตอนที่ 1</p>
        <h2 className="mt-1 text-lg font-semibold">สรุปเจ้าหนี้และโครงการ</h2>
        {campaignSummary ? (
          <div className="mt-4 rounded-lg bg-[#FFF8D9] p-4">
            <p className="text-sm font-semibold text-[#6B4F00]">{campaignSummary.organizationName}</p>
            <p className="mt-1 text-lg font-semibold">{campaignSummary.campaignTitle}</p>
            {campaignSummary.campaignDescription ? (
              <p className="mt-2 text-sm leading-6 text-[#4B5563]">{campaignSummary.campaignDescription}</p>
            ) : null}
          </div>
        ) : null}
        <input type="hidden" name="creditor_organization_id" value={campaignSummary?.organizationId ?? defaultCase?.creditor_organization_id ?? ""} />
        <input type="hidden" name="creditor_campaign_id" value={campaignSummary?.campaignId ?? defaultCase?.creditor_campaign_id ?? ""} />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {campaignSummary ? (
            <input type="hidden" name="creditor_name" value={creditorName} />
          ) : (
            <label className="block">
              <span className="text-sm font-medium">ชื่อเจ้าหนี้</span>
              <Input name="creditor_name" defaultValue={creditorName} className="mt-2" required />
            </label>
          )}
          <label className="block">
            <span className="text-sm font-medium">ประเภทเจ้าหนี้</span>
            <select name="creditor_type" defaultValue={getValue(state, defaultCase, "creditor_type", "bank")} className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm">
              <option value="bank">ธนาคาร</option>
              <option value="leasing">ลีสซิ่ง/เช่าซื้อ</option>
              <option value="credit_card">บัตรเครดิต</option>
              <option value="personal_loan">สินเชื่อส่วนบุคคล</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">ประเภทหนี้</span>
            <Input name="debt_type" defaultValue={debtType} className="mt-2" placeholder="เช่น สินเชื่อส่วนบุคคล" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium">เลขที่สัญญา</span>
            <Input name="contract_number" defaultValue={getValue(state, defaultCase, "contract_number")} className="mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">เลขบัญชี / เลขอ้างอิง</span>
            <Input name="account_number" defaultValue={getValue(state, defaultCase, "account_number")} className="mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ยอดหนี้โดยประมาณ</span>
            <Input name="debt_amount" type="number" min="0" step="0.01" defaultValue={getValue(state, defaultCase, "debt_amount")} className="mt-2" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ค้างชำระกี่เดือน</span>
            <Input name="overdue_months" type="number" min="0" defaultValue={getValue(state, defaultCase, "overdue_months", "0")} className="mt-2" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium">เบอร์ติดต่อ</span>
            <Input name="contact_phone" defaultValue={getValue(state, defaultCase, "contact_phone")} className="mt-2" required />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">ที่อยู่</span>
            <Input name="address" defaultValue={getValue(state, defaultCase, "address")} className="mt-2" placeholder="บ้านเลขที่ อาคาร ถนน ตำบล/แขวง" />
          </label>
          <CaseLocationFields province={province} district={district} />
        </div>
      </section>

      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#A87900]">ขั้นตอนที่ 2</p>
        <h2 className="mt-1 text-lg font-semibold">ข้อมูลหนี้และการติดต่อ</h2>
        <p className="mt-2 text-sm text-[#6B7280]">ระบุข้อมูลหนี้ พื้นที่ และช่องทางติดต่อสำหรับการตรวจสอบคำขอ</p>
      </section>

      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#A87900]">ขั้นตอนที่ 3</p>
        <h2 className="mt-1 text-lg font-semibold">สถานะทางการเงิน</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium">รายได้ต่อเดือน</span>
            <Input name="monthly_income" type="number" min="0" step="0.01" defaultValue={getValue(state, defaultCase, "monthly_income")} className="mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ค่าใช้จ่ายต่อเดือน</span>
            <Input name="monthly_expense" type="number" min="0" step="0.01" defaultValue={getValue(state, defaultCase, "monthly_expense")} className="mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ยอดที่ผ่อนได้ต่อเดือน</span>
            <Input name="affordable_monthly_payment" type="number" min="0" step="0.01" defaultValue={getValue(state, defaultCase, "affordable_monthly_payment")} className="mt-2" />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#A87900]">ขั้นตอนที่ 4</p>
        <h2 className="mt-1 text-lg font-semibold">รายละเอียดปัญหา</h2>
        <textarea
          name="problem_description"
          defaultValue={getValue(state, defaultCase, "problem_description")}
          className="mt-4 min-h-36 w-full rounded-lg border border-[#D1D5DB] px-3 py-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          placeholder="อธิบายสถานการณ์ รายได้ ภาระหนี้ และเหตุผลที่ต้องการไกล่เกลี่ย"
          required
        />
      </section>

      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#A87900]">ขั้นตอนที่ 5</p>
        <h2 className="mt-1 text-lg font-semibold">ข้อเสนอการชำระหนี้และเอกสาร</h2>
        <textarea
          name="desired_solution"
          defaultValue={getValue(state, defaultCase, "desired_solution")}
          className="mt-4 min-h-32 w-full rounded-lg border border-[#D1D5DB] px-3 py-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          placeholder="เช่น ขอปรับโครงสร้างหนี้ ลดค่างวด ขยายระยะเวลาผ่อนชำระ"
          required
        />
        {existingDocuments.length > 0 ? (
          <div className="mt-4 rounded-lg border border-[#E5E7EB] p-4">
            <p className="text-sm font-medium">เอกสารที่มีอยู่</p>
            <ul className="mt-2 space-y-1 text-sm text-[#4B5563]">
              {existingDocuments.map((document, index) => {
                const label = documentLabel(document);
                return label ? (
                  <li key={`${label}-${index}`}>
                    {label}
                    <input type="hidden" name="existing_uploaded_documents" value={JSON.stringify(document)} />
                  </li>
                ) : null;
              })}
            </ul>
          </div>
        ) : null}
        <label className="mt-4 block">
          <span className="text-sm font-medium">อัปโหลดเอกสารประกอบ</span>
          <Input name="documents" type="file" multiple className="mt-2 file:mr-3 file:rounded-md file:border-0 file:bg-[#FFF2A8] file:px-3 file:py-1.5 file:text-sm file:font-medium" />
        </label>
        <label className="mt-4 block">
          <span className="text-sm font-medium">ลิงก์เอกสารเพิ่มเติม (ถ้ามี)</span>
          <textarea
            name="uploaded_documents"
            defaultValue={state.values?.uploaded_documents ?? ""}
            className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
            placeholder="กรอก 1 ลิงก์ต่อบรรทัด"
          />
        </label>
      </section>

      <section className="rounded-lg border border-black/5 bg-[#111827] p-5 text-white shadow-sm">
        <p className="text-sm font-semibold text-[#FFD200]">ขั้นตอนที่ 6</p>
        <h2 className="mt-1 text-lg font-semibold">ตรวจสอบและบันทึกคำขอ</h2>
        <p className="mt-2 text-sm leading-6 text-white/70">
          ระบบจะบันทึกเป็นแบบร่างก่อน คุณสามารถเปิดรายละเอียดเพื่อส่งคำขอเข้าสู่การตรวจสอบได้
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <CaseFormSubmit label={submitLabel} />
          <Button href="/debtor" variant="outline" className="rounded-lg border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
            ยกเลิก
          </Button>
        </div>
      </section>
    </form>
  );
}
