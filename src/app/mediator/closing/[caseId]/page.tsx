import { closeMediationCase } from "@/app/mediator/closing/actions";
import { PortalShell } from "@/components/portal-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getMediatorProfileByUser } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MediatorClosingPage({
  params,
  searchParams,
}: {
  params: Promise<{ caseId: string }>;
  searchParams: Promise<{ appointment?: string; error?: string }>;
}) {
  const profile = await requireRole("mediator");
  const mediator = await getMediatorProfileByUser(profile.id);
  const { caseId } = await params;
  const { appointment, error } = await searchParams;
  const supabase = await createClient();
  const { data: item } = await supabase.from("cases").select("*").eq("id", caseId).eq("selected_mediator_profile_id", mediator?.id ?? "").maybeSingle();

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="ปิดเคสไกล่เกลี่ย"
      subtitle="บันทึกผลการไกล่เกลี่ย สร้างเอกสารข้อตกลง และออกใบแจ้งหนี้ให้เจ้าหนี้"
      userName={profile.full_name}
      sidebarItems={[]}
      metrics={[]}
      table={{ title: "Closing", description: "Closing form", columns: [], actionLabel: "Back" }}
    >
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      {!item ? (
        <Alert variant="destructive">ไม่พบเคสที่คุณได้รับมอบหมาย</Alert>
      ) : (
        <form action={closeMediationCase} className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <input type="hidden" name="case_id" value={item.id} />
          <input type="hidden" name="appointment_id" value={appointment ?? ""} />
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="text-xl font-semibold">เคส {item.case_number}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{item.creditor_name} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">ผลการไกล่เกลี่ย</span>
                <select name="result_status" defaultValue="settled" className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm">
                  <option value="settled">ไกล่เกลี่ยสำเร็จ</option>
                  <option value="not_settled">ไกล่เกลี่ยไม่สำเร็จ</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium">ยอดหนี้เดิม</span>
                <input name="original_debt_amount" type="number" step="0.01" min="0" defaultValue={Number(item.debt_amount)} className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" required />
              </label>
              <label className="block">
                <span className="text-sm font-medium">ยอดตกลงชำระ</span>
                <input name="settled_amount" type="number" step="0.01" min="0" className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">เงินดาวน์</span>
                <input name="down_payment_amount" type="number" step="0.01" min="0" defaultValue="0" className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">ค่างวด</span>
                <input name="installment_amount" type="number" step="0.01" min="0" defaultValue="0" className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">จำนวนงวด</span>
                <input name="number_of_installments" type="number" min="1" defaultValue="1" className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">วันครบกำหนดงวดแรก</span>
                <input name="first_payment_due_date" type="date" className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">ความถี่ชำระ</span>
                <select name="payment_frequency" defaultValue="monthly" className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm">
                  <option value="monthly">รายเดือน</option>
                  <option value="biweekly">ทุกสองสัปดาห์</option>
                  <option value="weekly">รายสัปดาห์</option>
                  <option value="custom">กำหนดเอง</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">เงื่อนไขพิเศษ</span>
                <textarea name="special_terms" className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">สรุปข้อตกลง / สรุปการพูดคุย</span>
                <textarea name="settlement_summary" className="mt-2 min-h-28 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">เหตุผลที่ไม่สำเร็จ</span>
                <textarea name="unsuccessful_reason" className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium">หมายเหตุผู้ไกล่เกลี่ย</span>
                <textarea name="mediator_note" className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" />
              </label>
            </div>
            <Button type="submit" className="mt-6 h-11 rounded-lg font-semibold">บันทึกผลและสร้างเอกสาร</Button>
          </section>

          <aside className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">ระบบจะสร้างให้อัตโนมัติ</h2>
            <ul className="mt-4 space-y-2 text-sm text-[#4B5563]">
              <li>แบบบันทึกข้อตกลงหรือรายงานปิดเคส</li>
              <li>ใบแจ้งหนี้ค่าบริการแพลตฟอร์ม</li>
              <li>Email log สำหรับลูกหนี้ เจ้าหนี้ และผู้ไกล่เกลี่ย</li>
              <li>อัปเดตสถานะเคสเป็น settled / not_settled</li>
            </ul>
          </aside>
        </form>
      )}
    </PortalShell>
  );
}
