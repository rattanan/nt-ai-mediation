import { CreditorShell } from "@/components/creditor/creditor-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { invoiceStatusLabels, listCreditorInvoices, money } from "@/lib/closing";
import { getCreditorOfficer, getCreditorOrganization } from "@/lib/creditor";

export const dynamic = "force-dynamic";

export default async function CreditorBillingPage() {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);
  const invoices = await listCreditorInvoices(organization?.id);

  return (
    <CreditorShell profile={profile} activePath="/creditor/billing" title="Billing" subtitle="ดูใบแจ้งหนี้ค่าบริการแพลตฟอร์มขององค์กร">
      <section className="rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold">ใบแจ้งหนี้ของ {organization?.organization_name ?? "องค์กร"}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]"><tr><th className="px-5 py-3">เลขที่</th><th className="px-5 py-3">เคส</th><th className="px-5 py-3">ยอดรวม</th><th className="px-5 py-3">ครบกำหนด</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3" /></tr></thead>
            <tbody>
              {invoices.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีใบแจ้งหนี้</td></tr> : invoices.map((invoice) => (
                <tr key={invoice.id} className="border-t border-black/5">
                  <td className="px-5 py-4 font-medium">{invoice.invoice_number}</td>
                  <td className="px-5 py-4">{invoice.cases?.case_number ?? "-"}</td>
                  <td className="px-5 py-4">{money(invoice.total_amount)}</td>
                  <td className="px-5 py-4">{invoice.due_at ? new Date(invoice.due_at).toLocaleDateString("th-TH") : "-"}</td>
                  <td className="px-5 py-4"><Badge>{invoiceStatusLabels[invoice.status]}</Badge></td>
                  <td className="px-5 py-4 text-right"><Button href={`/documents/invoices/${invoice.id}`} variant="outline" className="h-10 rounded-lg">ดาวน์โหลด</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </CreditorShell>
  );
}
