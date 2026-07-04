import { acceptCreditorCase, confirmCreditorAppointment, rejectCreditorCase, requestCreditorAppointmentReschedule, requestCreditorMoreInfo, submitCreditorResponse } from "@/app/creditor/actions";
import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { CreditorShell } from "@/components/creditor/creditor-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/server";
import { getActiveAppointmentForCase } from "@/lib/appointments";
import { caseStatusLabels } from "@/lib/cases";
import { getClosingForCase, resultStatusLabels } from "@/lib/closing";
import { getCreditorCase, getCreditorOfficer, getCreditorOrganization, getCreditorResponses } from "@/lib/creditor";

export const dynamic = "force-dynamic";

export default async function CreditorCaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const profile = await requireRole("creditor");
  const { id } = await params;
  const { success, error } = await searchParams;
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);

  if (!organization) {
    return (
      <CreditorShell profile={profile} activePath="/creditor" title="ไม่พบองค์กรเจ้าหนี้" subtitle="กรุณาลงทะเบียนองค์กรก่อนดูรายละเอียดเคส">
        <Alert variant="destructive">ไม่พบองค์กรเจ้าหนี้ที่เชื่อมกับบัญชีนี้</Alert>
      </CreditorShell>
    );
  }

  const item = await getCreditorCase(id, organization.id);
  const responses = await getCreditorResponses(id, organization.id);
  const appointment = await getActiveAppointmentForCase(id);
  const closing = await getClosingForCase(id);

  return (
    <CreditorShell profile={profile} activePath="/creditor" title={`เคส ${item.case_number}`} subtitle="ตรวจสอบคำขอไกล่เกลี่ยและส่งคำตอบกลับ">
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <div className="border-b border-black/5 pb-5">
            <Badge>{caseStatusLabels[item.status]}</Badge>
            <h2 className="mt-3 text-2xl font-semibold">{item.creditor_name}</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{item.debt_type} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-[#6B7280]">ประเภทเจ้าหนี้</dt><dd className="font-medium">{item.creditor_type}</dd></div>
            <div><dt className="text-sm text-[#6B7280]">ค้างชำระ</dt><dd className="font-medium">{item.overdue_months} เดือน</dd></div>
            <div><dt className="text-sm text-[#6B7280]">พื้นที่</dt><dd className="font-medium">{item.district}, {item.province}</dd></div>
            <div><dt className="text-sm text-[#6B7280]">เบอร์ติดต่อลูกหนี้</dt><dd className="font-medium">{item.contact_phone}</dd></div>
          </dl>

          <div className="mt-6 space-y-5">
            <div>
              <h3 className="font-semibold">สรุปข้อมูลลูกหนี้</h3>
              <p className="mt-2 rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">
                ข้อมูลผู้ยื่นคำขอจะแสดงจากโปรไฟล์ลูกหนี้เมื่อเชื่อมข้อมูลเพิ่มเติม
              </p>
            </div>
            <div>
              <h3 className="font-semibold">รายละเอียดปัญหา</h3>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{item.problem_description}</p>
            </div>
            <div>
              <h3 className="font-semibold">แนวทางที่ต้องการ</h3>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{item.desired_solution}</p>
            </div>
            <div>
              <h3 className="font-semibold">เอกสารแนบ</h3>
              <p className="mt-2 rounded-lg bg-[#F8FAFC] p-4 text-sm text-[#6B7280]">ยังไม่มี UI แสดงเอกสารใน prototype นี้</p>
            </div>
            <div>
              <h3 className="font-semibold">สรุปการสัมภาษณ์โดย AI</h3>
              <p className="mt-2 rounded-lg bg-[#F8FAFC] p-4 text-sm text-[#6B7280]">ข้อมูลสรุปจาก AI จะแสดงเมื่อโมดูลสัมภาษณ์พร้อมใช้งาน</p>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">การพิจารณาของเจ้าหนี้</h2>
            <form action={acceptCreditorCase} className="mt-4 space-y-3">
              <input type="hidden" name="case_id" value={item.id} />
              <textarea name="note" className="min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="หมายเหตุสำหรับการพิจารณา" />
              <Button type="submit" className="h-11 w-full rounded-lg font-semibold">รับคำขอไกล่เกลี่ย</Button>
            </form>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <form action={requestCreditorMoreInfo}>
                <input type="hidden" name="case_id" value={item.id} />
                <input type="hidden" name="note" value="เจ้าหนี้ขอข้อมูลเพิ่มเติม" />
                <Button type="submit" variant="outline" className="h-11 w-full rounded-lg font-semibold">ขอข้อมูลเพิ่ม</Button>
              </form>
              <form action={rejectCreditorCase}>
                <input type="hidden" name="case_id" value={item.id} />
                <input type="hidden" name="note" value="เจ้าหนี้ปฏิเสธคำขอ" />
                <Button type="submit" variant="outline" className="h-11 w-full rounded-lg font-semibold">ปฏิเสธ</Button>
              </form>
            </div>
          </section>

          {appointment ? (
            <AppointmentSummaryCard
              appointment={appointment}
              actions={
                <div className="space-y-3">
                  {!appointment.confirmed_by_creditor_at && appointment.status !== "cancelled" ? (
                    <form action={confirmCreditorAppointment} className="space-y-3">
                      <input type="hidden" name="appointment_id" value={appointment.id} />
                      <input type="hidden" name="case_id" value={item.id} />
                      <textarea name="note" className="min-h-20 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="หมายเหตุการยืนยันนัดหมาย" />
                      <Button type="submit" className="h-11 w-full rounded-lg font-semibold">ยืนยันนัดหมาย</Button>
                    </form>
                  ) : null}
                  {appointment.status !== "completed" && appointment.status !== "cancelled" ? (
                    <form action={requestCreditorAppointmentReschedule} className="space-y-3">
                      <input type="hidden" name="appointment_id" value={appointment.id} />
                      <input type="hidden" name="case_id" value={item.id} />
                      <textarea name="note" className="min-h-20 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="เหตุผลที่ต้องการขอเลื่อนนัด" />
                      <Button type="submit" variant="outline" className="h-11 w-full rounded-lg font-semibold">ขอเลื่อนนัด</Button>
                    </form>
                  ) : null}
                </div>
              }
            />
          ) : null}

          {closing ? (
            <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">เอกสารปิดเคส</h2>
              <p className="mt-1 text-sm text-[#6B7280]">{resultStatusLabels[closing.result_status]}</p>
              <div className="mt-4 grid gap-2">
                {closing.settlement_documents?.map((doc) => (
                  <Button key={doc.id} href={`/documents/settlements/${doc.id}`} variant="outline" className="h-11 rounded-lg">ดาวน์โหลดเอกสาร</Button>
                ))}
                {closing.billing_invoices?.map((invoice) => (
                  <Button key={invoice.id} href={`/documents/invoices/${invoice.id}`} className="h-11 rounded-lg">ดาวน์โหลดใบแจ้งหนี้</Button>
                ))}
              </div>
            </section>
          ) : null}

          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">เสนอเงื่อนไข settlement</h2>
            <form action={submitCreditorResponse} className="mt-4 space-y-3">
              <input type="hidden" name="case_id" value={item.id} />
              <input type="hidden" name="response" value="settlement_proposed" />
              <textarea name="proposed_terms" className="min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" placeholder="เงื่อนไข settlement ที่เสนอ" />
              <Input name="settlement_amount" type="number" min="0" step="0.01" placeholder="ยอด settlement" />
              <Input name="monthly_payment" type="number" min="0" step="0.01" placeholder="ยอดชำระต่อเดือน" />
              <Button type="submit" variant="outline" className="h-11 w-full rounded-lg font-semibold">บันทึกข้อเสนอ</Button>
            </form>
          </section>

          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">ประวัติการตอบกลับ</h2>
            <div className="mt-4 space-y-3">
              {responses.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีการตอบกลับ</p> : responses.map((response) => (
                <div key={response.id} className="rounded-lg bg-[#F8FAFC] p-3">
                  <p className="text-sm font-semibold">{response.response}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{new Date(response.created_at).toLocaleString("th-TH")}</p>
                  {response.reason ? <p className="mt-2 text-sm">{response.reason}</p> : null}
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </CreditorShell>
  );
}
