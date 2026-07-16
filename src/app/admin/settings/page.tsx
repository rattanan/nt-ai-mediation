import { saveAiRatePolicy, saveConsentVersion, saveFeeSettings } from "@/app/admin/settings/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getActiveConsentVersion } from "@/lib/consent";
import { getFeeSettings } from "@/lib/closing";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const profile = await requireRole("admin");
  const supabase = await createClient();
  const [settings, consent, { data: aiPolicy }] = await Promise.all([getFeeSettings(), getActiveConsentVersion(), supabase.from("ai_rate_policies").select("*").eq("debt_type", "*").maybeSingle()]);
  const { success, error } = await searchParams;
  return (
    <AdminShell profile={profile} activePath="/admin/settings" title="Platform Fee Settings" subtitle="ตั้งค่าค่าธรรมเนียมแพลตฟอร์มและข้อมูลชำระเงิน">
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      <form action={saveFeeSettings} className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <Field name="platform_fee_percent" label="Platform Fee (%)" value={settings.platform_fee_percent} />
          <Field name="success_fee_percent" label="Success Fee (%)" value={settings.success_fee_percent} />
          <Field name="vat_percent" label="VAT (%)" value={settings.vat_percent} />
          <Field name="currency" label="Currency" value={settings.currency} />
          <Field name="invoice_prefix" label="Invoice Prefix" value={settings.invoice_prefix} />
          <Field name="payment_due_days" label="Payment Due Days" value={settings.payment_due_days} />
          <Field name="bank_name" label="ธนาคาร" value={settings.bank_name ?? ""} />
          <Field name="bank_account_name" label="ชื่อบัญชี" value={settings.bank_account_name ?? ""} />
          <Field name="bank_account_number" label="เลขที่บัญชี" value={settings.bank_account_number ?? ""} />
          <label className="block md:col-span-3">
            <span className="text-sm font-medium">นโยบายค่าธรรมเนียม</span>
            <textarea name="fee_policy_description" defaultValue={settings.fee_policy_description ?? ""} className="mt-2 min-h-28 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" />
          </label>
        </div>
        <Button type="submit" className="mt-5 h-11 rounded-lg font-semibold">บันทึกการตั้งค่า</Button>
      </form>

      <form action={saveConsentVersion} className="mt-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Consent & Terms Version</h2>
          <p className="mt-1 text-sm text-[#6B7280]">แก้ไขข้อตกลงก่อนสมัครสมาชิก เวอร์ชันที่ active จะถูกใช้กับผู้ใช้ใหม่และผู้ใช้เดิมเมื่อเข้าสู่ระบบครั้งถัดไป</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="version" label="Consent Version" value={consent.version} />
          <Field name="title_en" label="English Title" value={consent.title_en} />
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">หัวข้อภาษาไทย</span>
            <input name="title_th" defaultValue={consent.title_th} className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">เนื้อหาภาษาไทย</span>
            <textarea name="content_th" defaultValue={consent.content_th} className="mt-2 min-h-72 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm leading-6" />
          </label>
          <label className="block md:col-span-2">
            <span className="text-sm font-medium">English Content</span>
            <textarea name="content_en" defaultValue={consent.content_en} className="mt-2 min-h-40 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm leading-6" />
          </label>
        </div>
        <Button type="submit" className="mt-5 h-11 rounded-lg font-semibold">บันทึก Consent Version</Button>
      </form>

      <form action={saveAiRatePolicy} className="mt-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="mb-5"><h2 className="text-lg font-semibold">AI Payment Plan Guardrails</h2><p className="mt-1 text-sm text-[#6B7280]">AI เลือกสมมติฐานได้เฉพาะภายในช่วงนี้ ระบบเป็นผู้คำนวณค่างวดและระยะเวลาเอง</p></div>
        <input type="hidden" name="debt_type" value="*"/>
        <div className="grid gap-4 md:grid-cols-4"><Field name="min_interest_rate" label="ดอกเบี้ยต่ำสุด (%)" value={aiPolicy?.min_interest_rate ?? 0}/><Field name="max_interest_rate" label="ดอกเบี้ยสูงสุด (%)" value={aiPolicy?.max_interest_rate ?? 15}/><Field name="min_discount_rate" label="ส่วนลดต่ำสุด (%)" value={aiPolicy?.min_discount_rate ?? 0}/><Field name="max_discount_rate" label="ส่วนลดสูงสุด (%)" value={aiPolicy?.max_discount_rate ?? 20}/></div>
        <Button type="submit" className="mt-5 h-11 rounded-lg font-semibold">บันทึก AI Guardrails</Button>
      </form>
    </AdminShell>
  );
}

function Field({ name, label, value }: { name: string; label: string; value: string | number }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><input name={name} defaultValue={value} className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" /></label>;
}
