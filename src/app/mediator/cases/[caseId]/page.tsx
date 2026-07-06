import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { PortalShell } from "@/components/portal-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getActiveAppointmentForCase } from "@/lib/appointments";
import { caseStatusLabels } from "@/lib/cases";
import { getClosingForCase, resultStatusLabels } from "@/lib/closing";
import { getCreditorResponses } from "@/lib/creditor";
import { mediatorSidebar } from "@/lib/mediator-portal";
import { getMediatorProfileByUser } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MediatorCaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const profile = await requireRole("mediator");
  const mediator = await getMediatorProfileByUser(profile.id);
  const { caseId } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("selected_mediator_profile_id", mediator?.id ?? "")
    .maybeSingle();

  if (!item) {
    return (
      <PortalShell
        roleLabel="Mediator Portal"
        title="ไม่พบเคส"
        subtitle="ตรวจสอบสิทธิ์หรือกลับไปที่รายการเคส"
        userName={profile.full_name}
        sidebarItems={mediatorSidebar("/mediator/cases")}
        metrics={[]}
        table={{ title: "", description: "", columns: [], actionLabel: "" }}
      >
        <Alert variant="destructive">ไม่พบเคสที่ได้รับมอบหมายให้คุณ</Alert>
      </PortalShell>
    );
  }

  const appointment = await getActiveAppointmentForCase(caseId);
  const responses = item.creditor_organization_id ? await getCreditorResponses(caseId, item.creditor_organization_id) : [];
  const closing = await getClosingForCase(caseId);

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title={`เคส ${item.case_number}`}
      subtitle="ดูข้อมูลคู่กรณี รายละเอียดปัญหา และข้อตกลงที่เกี่ยวข้อง"
      userName={profile.full_name}
      sidebarItems={mediatorSidebar("/mediator/cases")}
      metrics={[]}
      table={{ title: "", description: "", columns: [], actionLabel: "" }}
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <Badge>{caseStatusLabels[item.status]}</Badge>
          <h2 className="mt-3 text-2xl font-semibold">{item.creditor_name}</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{item.debt_type} · {Number(item.debt_amount).toLocaleString("th-TH")} บาท</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Info label="ค้างชำระ" value={`${item.overdue_months} เดือน`} />
            <Info label="พื้นที่" value={`${item.district}, ${item.province}`} />
            <Info label="โทรศัพท์ลูกหนี้" value={item.contact_phone} />
            <Info label="ผ่อนได้ต่อเดือน" value={`${Number(item.affordable_monthly_payment ?? 0).toLocaleString("th-TH")} บาท`} />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <TextPanel title="รายละเอียดปัญหา" value={item.problem_description} />
            <TextPanel title="แนวทางที่ลูกหนี้ต้องการ" value={item.desired_solution} />
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <TextPanel title="รายละเอียดข้อตกลงจากเจ้าหนี้" value={item.creditor_response_note || "ยังไม่มีการส่งเงื่อนไขจากเจ้าหนี้"} />
            <TextPanel title="ข้อตกลงปิดเคส" value={closing?.settlement_summary || (closing ? resultStatusLabels[closing.result_status] : "ยังไม่มีข้อตกลงปิดเคส")} />
          </div>

          <div className="mt-6">
            <h3 className="font-semibold">ประวัติการตอบกลับของเจ้าหนี้</h3>
            <div className="mt-3 space-y-2">
              {responses.length === 0 ? (
                <p className="text-sm text-[#6B7280]">ยังไม่มีการตอบกลับจากเจ้าหนี้</p>
              ) : responses.map((response) => (
                <div key={response.id} className="rounded-lg bg-[#F8FAFC] p-3 text-sm">
                  <p className="font-semibold">{response.response}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{new Date(response.created_at).toLocaleString("th-TH")}</p>
                  {response.reason ? <p className="mt-2 whitespace-pre-line">{response.reason}</p> : null}
                  {response.proposed_terms ? <p className="mt-2 whitespace-pre-line">{response.proposed_terms}</p> : null}
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          {appointment ? <AppointmentSummaryCard appointment={appointment} detailHref={`/mediator/appointments/${appointment.id}`} /> : null}
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">การดำเนินการ</h2>
            <div className="mt-4 grid gap-3">
              {appointment ? <Button href={`/mediator/appointments/${appointment.id}`} variant="outline" className="h-11 rounded-lg">ไปยังรายละเอียดนัดหมาย</Button> : null}
              <Button href={`/mediator/closing/${item.id}${appointment ? `?appointment=${appointment.id}` : ""}`} className="h-11 rounded-lg font-semibold">บันทึกผลและปิดเคส</Button>
            </div>
          </section>
        </aside>
      </div>
    </PortalShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[#F8FAFC] p-4"><p className="text-sm text-[#6B7280]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function TextPanel({ title, value }: { title: string; value: string }) {
  return <div><h3 className="font-semibold">{title}</h3><p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{value}</p></div>;
}
