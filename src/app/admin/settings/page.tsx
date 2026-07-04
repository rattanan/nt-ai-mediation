import { saveFeeSettings } from "@/app/admin/settings/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getFeeSettings } from "@/lib/closing";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string }> }) {
  const profile = await requireRole("admin");
  const settings = await getFeeSettings();
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
    </AdminShell>
  );
}

function Field({ name, label, value }: { name: string; label: string; value: string | number }) {
  return <label className="block"><span className="text-sm font-medium">{label}</span><input name={name} defaultValue={value} className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" /></label>;
}
