import { cancelInvoice, markInvoicePaid, resendInvoiceEmail } from "@/app/admin/billing/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { invoiceStatusLabels, listAdminInvoices, money } from "@/lib/closing";
import type { BillingInvoiceStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage({ searchParams }: { searchParams: Promise<{ success?: string; error?: string; status?: BillingInvoiceStatus; creditor?: string; date?: string }> }) {
  const profile = await requireRole("admin");
  const { success, error, status, creditor, date } = await searchParams;
  const invoices = await listAdminInvoices({ status, creditor, date });
  return (
    <AdminShell profile={profile} activePath="/admin/billing" title="Billing" subtitle="จัดการใบแจ้งหนี้ค่าบริการแพลตฟอร์ม">
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-4">
          <select name="status" defaultValue={status ?? ""} className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm">
            <option value="">ทุกสถานะ</option>
            <option value="issued">ออกใบแจ้งหนี้แล้ว</option>
            <option value="paid">ชำระแล้ว</option>
            <option value="overdue">ค้างชำระ</option>
            <option value="cancelled">ยกเลิก</option>
          </select>
          <input name="creditor" defaultValue={creditor ?? ""} placeholder="Creditor organization ID" className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm" />
          <input name="date" type="date" defaultValue={date ?? ""} className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm" />
          <Button type="submit" className="h-11 rounded-lg font-semibold">กรอง</Button>
        </form>
      </section>
      <section className="mt-6 rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4"><h2 className="text-lg font-semibold">ใบแจ้งหนี้ทั้งหมด</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]"><tr><th className="px-5 py-3">เลขที่</th><th className="px-5 py-3">เคส</th><th className="px-5 py-3">เจ้าหนี้</th><th className="px-5 py-3">ยอดรวม</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">จัดการ</th></tr></thead>
            <tbody>
              {invoices.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีใบแจ้งหนี้</td></tr> : invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-black/5 align-top">
                  <td className="px-5 py-4 font-medium">{invoice.invoice_number}</td>
                  <td className="px-5 py-4">{invoice.cases?.case_number ?? "-"}</td>
                  <td className="px-5 py-4">{invoice.creditor_organizations?.organization_name ?? "-"}</td>
                  <td className="px-5 py-4">{money(invoice.total_amount)}</td>
                  <td className="px-5 py-4"><Badge>{invoiceStatusLabels[invoice.status]}</Badge></td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-2">
                      <Button href={`/documents/invoices/${invoice.id}`} variant="outline" className="h-10 rounded-lg">ดาวน์โหลด</Button>
                      <form action={markInvoicePaid}><input type="hidden" name="invoice_id" value={invoice.id} /><Button type="submit" className="h-10 rounded-lg">ชำระแล้ว</Button></form>
                      <form action={cancelInvoice}><input type="hidden" name="invoice_id" value={invoice.id} /><Button type="submit" variant="outline" className="h-10 rounded-lg">ยกเลิก</Button></form>
                      <form action={resendInvoiceEmail}><input type="hidden" name="invoice_id" value={invoice.id} /><input type="hidden" name="case_id" value={invoice.case_id} /><Button type="submit" variant="outline" className="h-10 rounded-lg">ส่งอีเมลอีกครั้ง</Button></form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
