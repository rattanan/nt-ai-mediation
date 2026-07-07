import { PortalShell } from "@/components/portal-shell";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getClosingDetail, invoiceDocumentUrl, settlementDocumentPageUrl, settlementDocumentUrl } from "@/lib/closing";

export const dynamic = "force-dynamic";

export default async function ClosingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ closing?: string }>;
}) {
  const profile = await requireRole("mediator");
  const { closing } = await searchParams;
  const detail = closing ? await getClosingDetail(closing) : null;
  const document = detail?.settlement_documents?.[0];
  const invoice = detail?.billing_invoices?.[0];

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="ปิดเคสสำเร็จ"
      subtitle="ระบบสร้างเอกสารและใบแจ้งหนี้เรียบร้อยแล้ว"
      userName={profile.full_name}
      sidebarItems={[]}
      metrics={[]}
      table={{ title: "Closing", description: "Success", columns: [], actionLabel: "Back" }}
    >
      <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h2 className="text-xl font-semibold text-emerald-900">บันทึกผลการไกล่เกลี่ยเรียบร้อย</h2>
        <p className="mt-2 text-sm text-emerald-800">เปิดเอกสารเพื่อลงนาม ส่งต่อให้คู่กรณีลงนาม หรือดาวน์โหลด PDF ได้ทันที</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {document ? <Button href={settlementDocumentPageUrl(document.id)} className="rounded-lg font-semibold">เปิดเอกสารเพื่อลงนาม</Button> : null}
          {document ? <Button href={settlementDocumentUrl(document.id)} variant="outline" className="rounded-lg font-semibold">ดาวน์โหลด PDF บันทึกข้อตกลง</Button> : null}
          {invoice ? <Button href={invoiceDocumentUrl(invoice.id)} variant="outline" className="rounded-lg font-semibold">ดูใบแจ้งหนี้</Button> : null}
          <Button href="/mediator" variant="outline" className="rounded-lg font-semibold">กลับแดชบอร์ด</Button>
        </div>
      </section>
    </PortalShell>
  );
}
