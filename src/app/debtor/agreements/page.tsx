import Link from "next/link";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, getPage, paginateItems } from "@/components/ui/pagination";
import { requireRole } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DebtorAgreementsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireRole("debtor");
  const { page: pageParam } = await searchParams;
  const supabase = await createClient();
  const { data: closings } = await supabase
    .from("mediation_closing_records")
    .select("*")
    .eq("debtor_user_id", profile.id)
    .order("closed_at", { ascending: false });

  const agreements = closings ?? [];
  const caseIds = agreements.map((item) => item.case_id);
  const closingIds = agreements.map((item) => item.id);
  const [{ data: cases }, { data: plans }, { data: documents }] = await Promise.all([
    caseIds.length > 0 ? supabase.from("cases").select("*").in("id", caseIds) : Promise.resolve({ data: [] }),
    closingIds.length > 0 ? supabase.from("settlement_payment_plans").select("*").in("closing_record_id", closingIds) : Promise.resolve({ data: [] }),
    closingIds.length > 0 ? supabase.from("settlement_documents").select("*").in("closing_record_id", closingIds) : Promise.resolve({ data: [] }),
  ]);
  const caseById = new Map((cases ?? []).map((item) => [item.id, item]));
  const planByClosingId = new Map((plans ?? []).map((item) => [item.closing_record_id, item]));
  const documentByClosingId = new Map((documents ?? []).map((item) => [item.closing_record_id, item]));
  const pageSize = 6;
  const { page, pageItems: pagedAgreements, total } = paginateItems(agreements, getPage(pageParam), pageSize);

  return (
    <DebtorShell profile={profile} activePath="/debtor/agreements" title="ข้อตกลง" subtitle="ดูผลการไกล่เกลี่ย เอกสารข้อตกลง และแผนการชำระเงิน">
      <section className="rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold">ข้อตกลงและเอกสารปิดเคส</h2>
          <p className="mt-1 text-sm text-[#6B7280]">แสดงรายการหลังผู้ไกล่เกลี่ยบันทึกผลการไกล่เกลี่ย</p>
        </div>
        <div className="divide-y divide-black/5">
          {pagedAgreements.length === 0 ? (
            <div className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีข้อตกลงในระบบ</div>
          ) : pagedAgreements.map((closing) => {
            const caseItem = caseById.get(closing.case_id);
            const plan = planByClosingId.get(closing.id);
            const document = documentByClosingId.get(closing.id);
            return (
              <article key={closing.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Badge>{closing.result_status === "settled" ? "ตกลงสำเร็จ" : "ไม่สามารถตกลงได้"}</Badge>
                    <h3 className="mt-3 text-lg font-semibold">เคส {caseItem?.case_number ?? "-"}</h3>
                    <p className="mt-1 text-sm text-[#6B7280]">ปิดเคสเมื่อ {new Date(closing.closed_at).toLocaleDateString("th-TH")}</p>
                  </div>
                  <div className="flex gap-2">
                    {document?.pdf_url ? (
                      <Button href={document.pdf_url} variant="outline" className="rounded-lg font-semibold">เปิดเอกสาร</Button>
                    ) : null}
                    <Button href={`/documents/certificates/${closing.case_id}`} className="rounded-lg font-semibold">ใบรับรอง</Button>
                  </div>
                </div>
                <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div><dt className="text-sm text-[#6B7280]">ยอดหนี้เดิม</dt><dd className="font-semibold">{Number(closing.original_debt_amount).toLocaleString("th-TH")} บาท</dd></div>
                  <div><dt className="text-sm text-[#6B7280]">ยอดตกลง</dt><dd className="font-semibold">{Number(closing.settled_amount ?? 0).toLocaleString("th-TH")} บาท</dd></div>
                  <div><dt className="text-sm text-[#6B7280]">ผ่อนชำระ</dt><dd className="font-semibold">{plan ? `${Number(plan.installment_amount).toLocaleString("th-TH")} บาท x ${plan.number_of_installments}` : "-"}</dd></div>
                </dl>
                {closing.settlement_summary ? <p className="mt-4 rounded-lg bg-[#F8FAFC] p-3 text-sm leading-6 text-[#374151]">{closing.settlement_summary}</p> : null}
                <Link href={`/debtor/cases/${closing.case_id}`} className="mt-4 inline-block text-sm font-semibold text-[#8A6500]">ดูรายละเอียดเคส</Link>
              </article>
            );
          })}
        </div>
        <Pagination basePath="/debtor/agreements" params={{}} page={page} pageSize={pageSize} total={total} />
      </section>
    </DebtorShell>
  );
}
