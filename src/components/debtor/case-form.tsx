import type { MediationCase } from "@/lib/cases";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CaseForm({
  action,
  submitLabel,
  defaultCase,
  campaignSummary,
}: {
  action: (formData: FormData) => Promise<void>;
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
  return (
    <form action={action} className="space-y-6">
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
          <label className="block">
            <span className="text-sm font-medium">ชื่อเจ้าหนี้</span>
            <Input name="creditor_name" defaultValue={defaultCase?.creditor_name ?? campaignSummary?.organizationName ?? ""} className="mt-2" required readOnly={Boolean(campaignSummary)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ประเภทเจ้าหนี้</span>
            <select name="creditor_type" defaultValue={defaultCase?.creditor_type ?? "bank"} className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm">
              <option value="bank">ธนาคาร</option>
              <option value="leasing">ลีสซิ่ง/เช่าซื้อ</option>
              <option value="credit_card">บัตรเครดิต</option>
              <option value="personal_loan">สินเชื่อส่วนบุคคล</option>
              <option value="other">อื่น ๆ</option>
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium">ประเภทหนี้</span>
            <Input name="debt_type" defaultValue={defaultCase?.debt_type ?? campaignSummary?.debtType ?? ""} className="mt-2" placeholder="เช่น สินเชื่อส่วนบุคคล" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium">เลขที่สัญญา</span>
            <Input name="contract_number" defaultValue={defaultCase?.contract_number ?? ""} className="mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">เลขบัญชี / เลขอ้างอิง</span>
            <Input name="account_number" defaultValue={defaultCase?.account_number ?? ""} className="mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ยอดหนี้โดยประมาณ</span>
            <Input name="debt_amount" type="number" min="0" step="0.01" defaultValue={defaultCase?.debt_amount ?? ""} className="mt-2" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ค้างชำระกี่เดือน</span>
            <Input name="overdue_months" type="number" min="0" defaultValue={defaultCase?.overdue_months ?? 0} className="mt-2" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium">เบอร์ติดต่อ</span>
            <Input name="contact_phone" defaultValue={defaultCase?.contact_phone ?? ""} className="mt-2" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium">จังหวัด</span>
            <Input name="province" defaultValue={defaultCase?.province ?? ""} className="mt-2" required />
          </label>
          <label className="block">
            <span className="text-sm font-medium">อำเภอ/เขต</span>
            <Input name="district" defaultValue={defaultCase?.district ?? ""} className="mt-2" required />
          </label>
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
            <Input name="monthly_income" type="number" min="0" step="0.01" defaultValue={defaultCase?.monthly_income ?? ""} className="mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ค่าใช้จ่ายต่อเดือน</span>
            <Input name="monthly_expense" type="number" min="0" step="0.01" defaultValue={defaultCase?.monthly_expense ?? ""} className="mt-2" />
          </label>
          <label className="block">
            <span className="text-sm font-medium">ยอดที่ผ่อนได้ต่อเดือน</span>
            <Input name="affordable_monthly_payment" type="number" min="0" step="0.01" defaultValue={defaultCase?.affordable_monthly_payment ?? ""} className="mt-2" />
          </label>
        </div>
      </section>

      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-[#A87900]">ขั้นตอนที่ 4</p>
        <h2 className="mt-1 text-lg font-semibold">รายละเอียดปัญหา</h2>
        <textarea
          name="problem_description"
          defaultValue={defaultCase?.problem_description ?? ""}
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
          defaultValue={defaultCase?.desired_solution ?? ""}
          className="mt-4 min-h-32 w-full rounded-lg border border-[#D1D5DB] px-3 py-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          placeholder="เช่น ขอปรับโครงสร้างหนี้ ลดค่างวด ขยายระยะเวลาผ่อนชำระ"
          required
        />
        <label className="mt-4 block">
          <span className="text-sm font-medium">รายการเอกสาร / ลิงก์เอกสารประกอบ</span>
          <textarea
            name="uploaded_documents"
            defaultValue={Array.isArray(defaultCase?.uploaded_documents) ? defaultCase.uploaded_documents.join("\n") : ""}
            className="mt-2 min-h-28 w-full rounded-lg border border-[#D1D5DB] px-3 py-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
            placeholder="กรอก 1 รายการต่อบรรทัด เช่น สำเนาสัญญา / statement / ลิงก์ไฟล์"
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
          <Button type="submit" className="rounded-lg font-semibold">
            {submitLabel}
          </Button>
          <Button href="/debtor" variant="outline" className="rounded-lg border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
            ยกเลิก
          </Button>
        </div>
      </section>
    </form>
  );
}
