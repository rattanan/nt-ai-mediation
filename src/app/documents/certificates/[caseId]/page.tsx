import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/server";
import { getOrCreateCompletionCertificate } from "@/lib/certificates";
import { money } from "@/lib/closing";

export const dynamic = "force-dynamic";

export default async function CompletionCertificatePage({ params }: { params: Promise<{ caseId: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const { caseId } = await params;
  const { certificate, closing } = await getOrCreateCompletionCertificate(caseId);
  const item = closing.cases;
  const plan = closing.settlement_payment_plans?.[0];
  const mediatorName = closing.mediator_profiles
    ? `${closing.mediator_profiles.title ?? ""} ${closing.mediator_profiles.first_name} ${closing.mediator_profiles.last_name}`.trim()
    : "-";
  const discount = closing.settled_amount ? Math.max(0, closing.original_debt_amount - closing.settled_amount) : 0;

  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-10 text-[#111827] print:px-0">
      <div className="mb-6 flex justify-between print:hidden">
        <a href="#" className="rounded-lg bg-[#FFD200] px-4 py-2 text-sm font-semibold">ใช้เมนู Print / Save as PDF</a>
      </div>
      <header className="border-b border-black pb-6 text-center">
        <p className="text-sm font-semibold uppercase text-[#A87900]">NT AI Digital Mediation Platform</p>
        <h1 className="mt-3 text-3xl font-bold">หนังสือรับรองการไกล่เกลี่ยสำเร็จ</h1>
        <p className="mt-2 text-sm">Completion Certificate</p>
        <p className="mt-4 text-sm font-semibold">เลขที่ {certificate.certificate_number}</p>
      </header>

      <section className="mt-8 rounded-lg border border-[#E5E7EB] p-6 text-center leading-8">
        <p>ขอรับรองว่าเคสไกล่เกลี่ยเลขที่</p>
        <p className="mt-2 text-2xl font-bold">{item?.case_number ?? "-"}</p>
        <p className="mt-3">
          ได้ดำเนินการผ่านระบบ NT AI Digital Mediation Platform และคู่กรณีสามารถบรรลุข้อตกลงร่วมกันได้
        </p>
        <p className="mt-3">วันที่ปิดผลการไกล่เกลี่ย {new Date(closing.closed_at).toLocaleDateString("th-TH")}</p>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <Info label="เจ้าหนี้" value={closing.creditor_organizations?.organization_name ?? item?.creditor_name ?? "-"} />
        <Info label="ผู้ไกล่เกลี่ย" value={mediatorName} />
        <Info label="ยอดหนี้เดิม" value={money(closing.original_debt_amount)} />
        <Info label="ยอดตกลงชำระ" value={money(closing.settled_amount)} />
        <Info label="ส่วนลด" value={money(discount)} />
        <Info label="จำนวนงวด" value={`${plan?.number_of_installments ?? 0} งวด`} />
      </section>

      <section className="mt-10 grid gap-8 sm:grid-cols-3">
        <Signature label="ลูกหนี้" />
        <Signature label="เจ้าหนี้" />
        <Signature label="ผู้ไกล่เกลี่ย" />
      </section>

      <footer className="mt-10 border-t border-black pt-4 text-center text-xs text-[#6B7280]">
        ออกเอกสารเมื่อ {new Date(certificate.issued_at).toLocaleString("th-TH")}
      </footer>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-sm text-[#6B7280]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function Signature({ label }: { label: string }) {
  return <div className="pt-12 text-center"><div className="border-t border-black pt-2 text-sm">ลงชื่อ {label}</div></div>;
}
