import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { getFeeSettings, getInvoice, invoiceStatusLabels, money } from "@/lib/closing";

export const dynamic = "force-dynamic";

export default async function InvoiceDocumentPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { invoiceId } = await params;
  const invoice = await getInvoice(invoiceId);
  const settings = await getFeeSettings();

  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-10 text-[#111827] print:px-0">
      <header className="border-b border-black pb-5">
        <p className="text-sm font-semibold text-[#A87900]">NT AI Digital Mediation Platform</p>
        <h1 className="mt-2 text-3xl font-bold">ใบแจ้งหนี้ค่าบริการแพลตฟอร์ม</h1>
        <p className="mt-2 text-sm">เลขที่ใบแจ้งหนี้: {invoice.invoice_number}</p>
      </header>
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info label="องค์กรเจ้าหนี้" value={invoice.creditor_organizations?.organization_name ?? "-"} />
        <Info label="เลขเคส" value={invoice.cases?.case_number ?? "-"} />
        <Info label="สถานะ" value={invoiceStatusLabels[invoice.status]} />
        <Info label="ครบกำหนดชำระ" value={invoice.due_at ? new Date(invoice.due_at).toLocaleDateString("th-TH") : "-"} />
        <Info label="ยอดหนี้เดิม" value={money(invoice.original_debt_amount, settings.currency)} />
        <Info label="ยอดตกลงชำระ" value={invoice.settled_amount ? money(invoice.settled_amount, settings.currency) : "-"} />
      </section>
      <section className="mt-8">
        <h2 className="text-xl font-semibold">รายการค่าบริการ</h2>
        <table className="mt-3 w-full border-collapse text-sm">
          <thead><tr className="bg-[#F8FAFC]"><th className="border p-3 text-left">รายการ</th><th className="border p-3 text-right">ฐานคำนวณ</th><th className="border p-3 text-right">%</th><th className="border p-3 text-right">จำนวนเงิน</th></tr></thead>
          <tbody>
            {(invoice.billing_invoice_items ?? []).map((item) => (
              <tr key={item.id}>
                <td className="border p-3">{item.description ?? item.item_name}</td>
                <td className="border p-3 text-right">{money(item.calculation_base_amount, settings.currency)}</td>
                <td className="border p-3 text-right">{item.fee_percent}%</td>
                <td className="border p-3 text-right">{money(item.amount, settings.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="mt-6 ml-auto max-w-sm space-y-2 text-sm">
        <Line label="Platform Fee" value={money(invoice.platform_fee_amount, settings.currency)} />
        <Line label="Success Fee" value={money(invoice.success_fee_amount, settings.currency)} />
        <Line label={`VAT ${invoice.vat_percent}%`} value={money(invoice.vat_amount, settings.currency)} />
        <div className="border-t pt-3 text-lg font-bold"><Line label="รวมทั้งสิ้น" value={money(invoice.total_amount, settings.currency)} /></div>
      </section>
      <section className="mt-8 rounded-lg border p-4 text-sm leading-7">
        <h2 className="font-semibold">ข้อมูลการชำระเงิน</h2>
        <p>ธนาคาร: {settings.bank_name ?? "-"}</p>
        <p>ชื่อบัญชี: {settings.bank_account_name ?? "-"}</p>
        <p>เลขที่บัญชี: {settings.bank_account_number ?? "-"}</p>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-sm text-[#6B7280]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span>{label}</span><span>{value}</span></div>;
}
