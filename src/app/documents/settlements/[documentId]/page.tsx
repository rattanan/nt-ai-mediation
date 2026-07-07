import Link from "next/link";
import { signSettlementDocument } from "@/app/documents/settlements/[documentId]/actions";
import { getCurrentProfile } from "@/lib/auth/server";
import { getSettlementDocument, money, paymentFrequencyLabels, resultStatusLabels } from "@/lib/closing";
import { getCreditorOfficer } from "@/lib/creditor";
import { createClient } from "@/lib/supabase/server";
import type { SettlementDocumentSignatureRole } from "@/types/database";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettlementDocumentPage({ params, searchParams }: { params: Promise<{ documentId: string }>; searchParams: Promise<{ success?: string; error?: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  const { documentId } = await params;
  const { success, error } = await searchParams;
  const document = await getSettlementDocument(documentId);
  const closing = document.mediation_closing_records;
  const item = closing.cases;
  const plan = closing.settlement_payment_plans?.[0];
  const settled = closing.result_status === "settled";
  const signatures = document.settlement_document_signatures ?? [];
  const signatureByRole = new Map(signatures.map((row) => [row.signer_role, row]));
  const supabase = await createClient();
  const [{ data: debtorProfile }, { data: mediatorProfile }, creditorOfficer] = await Promise.all([
    supabase.from("profiles").select("id, full_name").eq("id", closing.debtor_user_id).maybeSingle(),
    supabase.from("mediator_profiles").select("id, first_name, last_name, title, user_id").eq("id", closing.mediator_id).maybeSingle(),
    profile.role === "creditor" ? getCreditorOfficer(profile.id) : Promise.resolve(null),
  ]);

  const canSignDebtor = profile.role === "debtor" && profile.id === closing.debtor_user_id && !signatureByRole.has("debtor");
  const canSignCreditor = profile.role === "creditor" && creditorOfficer?.organization_id === closing.creditor_organization_id && !signatureByRole.has("creditor");
  const canSignMediator = profile.role === "mediator" && profile.id === mediatorProfile?.user_id && !signatureByRole.has("mediator");
  const requiredRoles: SettlementDocumentSignatureRole[] = ["debtor", "creditor", "mediator"];
  const completedSignatures = requiredRoles.filter((role) => signatureByRole.has(role)).length;
  const allSigned = completedSignatures === 3;

  return (
    <main className="mx-auto max-w-4xl bg-white px-8 py-10 text-[#111827] print:px-0">
      <div className="mb-6 flex flex-wrap gap-2 print:hidden">
        <Link href={`/documents/settlements/${documentId}/pdf`} className="rounded-lg bg-[#FFD200] px-4 py-2 text-sm font-semibold">ดาวน์โหลดบันทึกตกลงข้อพิพาทพร้อมลายเซ็น</Link>
        <a href="#" onClick={undefined} className="rounded-lg border border-black/10 px-4 py-2 text-sm font-semibold" suppressHydrationWarning>ใช้เมนู Print / Save as PDF</a>
      </div>
      {success ? <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p> : null}
      {error ? <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
      <section className={`mb-6 rounded-lg border p-4 text-sm print:hidden ${allSigned ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]"}`}>
        <p className="font-semibold">{allSigned ? "ลงนามครบถ้วนแล้ว" : `รอลงนาม ${3 - completedSignatures} ฝ่าย`}</p>
        <p className="mt-1">{allSigned ? "ระบบปิดเคสสมบูรณ์แล้ว และสามารถดาวน์โหลดบันทึกตกลงข้อพิพาทพร้อมลายเซ็นได้" : "เมื่อลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ยลงนามครบ ระบบจะปิดเคสให้อัตโนมัติ"}</p>
      </section>
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
        <SignatureBox label="ลูกหนี้" signature={signatureByRole.get("debtor") ?? null} action={canSignDebtor ? <SignForm documentId={documentId} caseId={closing.case_id} signerRole="debtor" signerName={debtorProfile?.full_name ?? profile.full_name} /> : null} />
        <SignatureBox label="เจ้าหนี้" signature={signatureByRole.get("creditor") ?? null} action={canSignCreditor ? <SignForm documentId={documentId} caseId={closing.case_id} signerRole="creditor" signerName={closing.creditor_organizations?.organization_name ?? profile.full_name} /> : null} />
        <SignatureBox label="ผู้ไกล่เกลี่ย" signature={signatureByRole.get("mediator") ?? null} action={canSignMediator ? <SignForm documentId={documentId} caseId={closing.case_id} signerRole="mediator" signerName={mediatorProfile ? `${mediatorProfile.title ?? ""} ${mediatorProfile.first_name} ${mediatorProfile.last_name}`.trim() : profile.full_name} /> : null} />
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

function SignatureBox({ label, signature, action }: { label: string; signature: { signer_name: string; signed_at: string } | null; action: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black/10 p-4">
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-14 border-t border-black pt-2 text-center text-sm">
        {signature ? (
          <>
            <p className="font-semibold">{signature.signer_name}</p>
            <p className="text-xs text-[#6B7280]">ลงนามเมื่อ {new Date(signature.signed_at).toLocaleString("th-TH")}</p>
          </>
        ) : (
          <p className="text-[#6B7280]">ยังไม่ได้ลงนาม</p>
        )}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

function SignForm({ documentId, caseId, signerRole, signerName }: { documentId: string; caseId: string; signerRole: "debtor" | "creditor" | "mediator"; signerName: string }) {
  return (
    <form action={signSettlementDocument} className="space-y-3">
      <input type="hidden" name="document_id" value={documentId} />
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="signer_role" value={signerRole} />
      <input name="signer_name" defaultValue={signerName} className="h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
      <button type="submit" className="h-11 w-full rounded-lg bg-[#FFD200] px-4 text-sm font-semibold">ลงนามเอกสาร</button>
    </form>
  );
}
