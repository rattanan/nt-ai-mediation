import { getSettlementDocument, money, paymentFrequencyLabels, resultStatusLabels } from "@/lib/closing";
import { getCurrentProfile } from "@/lib/auth/server";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettlementDocumentPage({ params }: { params: Promise<{ documentId: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { documentId } = await params;
  const document = await getSettlementDocument(documentId);
  const closing = document.mediation_closing_records;
  const item = closing.cases;
  const plan = closing.settlement_payment_plans?.[0];
  const settled = closing.result_status === "settled";

  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-10 text-[#111827] print:px-0">
      <div className="mb-6 flex justify-between print:hidden">
        <a href="#" onClick={undefined} className="rounded-lg bg-[#FFD200] px-4 py-2 text-sm font-semibold" suppressHydrationWarning>ใช้เมนู Print / Save as PDF</a>
      </div>
      <header className="border-b border-black pb-5">
        <p className="text-sm font-semibold text-[#A87900]">NT AI Digital Mediation Platform</p>
        <h1 className="mt-2 text-3xl font-bold">{settled ? "แบบบันทึกข้อตกลงระงับข้อพิพาท" : "แบบบันทึกผลการไกล่เกลี่ยไม่สำเร็จ"}</h1>
        <p className="mt-2 text-sm">วันที่สร้างเอกสาร: {new Date(document.generated_at).toLocaleString("th-TH")}</p>
      </header>
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Info label="เลขเคส" value={item?.case_number ?? "-"} />
        <Info label="สถานะผล" value={resultStatusLabels[closing.result_status]} />
        <Info label="เจ้าหนี้" value={closing.creditor_organizations?.organization_name ?? item?.creditor_name ?? "-"} />
        <Info label="ผู้ไกล่เกลี่ย" value={closing.mediator_profiles ? `${closing.mediator_profiles.first_name} ${closing.mediator_profiles.last_name}` : "-"} />
        <Info label="ยอดหนี้เดิม" value={money(closing.original_debt_amount)} />
        {settled ? <Info label="ยอดตกลงชำระ" value={money(closing.settled_amount)} /> : null}
      </section>
      {settled ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">แผนการชำระเงิน</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Info label="เงินดาวน์" value={money(plan?.down_payment_amount)} />
            <Info label="ค่างวด" value={money(plan?.installment_amount)} />
            <Info label="จำนวนงวด" value={`${plan?.number_of_installments ?? 0} งวด`} />
            <Info label="ความถี่" value={plan ? paymentFrequencyLabels[plan.payment_frequency] : "-"} />
            <Info label="ครบกำหนดงวดแรก" value={plan?.first_payment_due_date ?? "-"} />
            <Info label="วิธีชำระเงิน" value={plan?.payment_method ?? "-"} />
          </div>
          <TextBlock title="เงื่อนไขพิเศษ" value={plan?.special_terms} />
        </section>
      ) : (
        <TextBlock title="เหตุผลที่ไกล่เกลี่ยไม่สำเร็จ" value={closing.unsuccessful_reason} />
      )}
      <TextBlock title={settled ? "สรุปข้อตกลง" : "สรุปการพูดคุย"} value={closing.settlement_summary} />
      <TextBlock title="หมายเหตุผู้ไกล่เกลี่ย" value={closing.mediator_note} />
      <section className="mt-10 grid gap-8 sm:grid-cols-3">
        <Signature label="ลูกหนี้" />
        <Signature label="เจ้าหนี้" />
        <Signature label="ผู้ไกล่เกลี่ย" />
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-sm text-[#6B7280]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function TextBlock({ title, value }: { title: string; value?: string | null }) {
  return <section className="mt-8"><h2 className="text-xl font-semibold">{title}</h2><p className="mt-3 whitespace-pre-line rounded-lg border p-4 text-sm leading-7">{value || "-"}</p></section>;
}

function Signature({ label }: { label: string }) {
  return <div className="pt-12 text-center"><div className="border-t border-black pt-2 text-sm">ลงชื่อ {label}</div></div>;
}
