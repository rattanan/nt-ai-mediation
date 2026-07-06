import Link from "next/link";
import { adminCancelAppointment, adminForceReschedule, adminUpdateMeetingUrl } from "@/app/admin/appointments/actions";
import { AppointmentStatusBadge } from "@/components/appointments/appointment-status-badge";
import { AdminShell } from "@/components/admin/admin-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { getPage, paginateItems, Pagination } from "@/components/ui/pagination";
import { requireRole } from "@/lib/auth/server";
import { formatAppointmentDateTime, getAdminAppointments } from "@/lib/appointments";
import type { AppointmentStatus } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    success?: string;
    error?: string;
    status?: AppointmentStatus;
    date?: string;
    mediator?: string;
    creditor?: string;
    page?: string;
    sort?: "case_number" | "appointment_date" | "status";
    dir?: "asc" | "desc";
  }>;
}) {
  const profile = await requireRole("admin");
  const { success, error, status, date, mediator, creditor, page: pageParam, sort = "appointment_date", dir = "desc" } = await searchParams;
  const appointments = await getAdminAppointments({
    status,
    date,
    mediatorId: mediator,
    creditorOrganizationId: creditor,
  });
  const sortedAppointments = [...appointments].sort((a, b) => {
    const factor = dir === "asc" ? 1 : -1;
    if (sort === "case_number") return String(a.cases?.case_number ?? "").localeCompare(String(b.cases?.case_number ?? ""), "th") * factor;
    if (sort === "status") return String(a.status).localeCompare(String(b.status), "th") * factor;
    return (String(a.appointment_date).localeCompare(String(b.appointment_date), "th") || String(a.start_time).localeCompare(String(b.start_time), "th")) * factor;
  });
  const pageSize = 10;
  const { page, pageItems: pagedAppointments } = paginateItems(sortedAppointments, getPage(pageParam), pageSize);

  return (
    <AdminShell
      profile={profile}
      activePath="/admin/appointments"
      title="Appointments"
      subtitle="ดูนัดหมายทั้งหมด กรองตามสถานะ/วันที่ และจัดการเลื่อนหรือยกเลิกเมื่อจำเป็น"
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <form className="grid gap-3 md:grid-cols-4">
          <select name="status" defaultValue={status ?? ""} className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm">
            <option value="">ทุกสถานะ</option>
            <option value="pending_confirmation">รอยืนยัน</option>
            <option value="confirmed">ยืนยันแล้ว</option>
            <option value="reschedule_requested">ขอเลื่อนนัด</option>
            <option value="completed">เสร็จสิ้น</option>
            <option value="cancelled">ยกเลิก</option>
            <option value="no_show">ไม่มาตามนัด</option>
          </select>
          <input name="date" type="date" defaultValue={date ?? ""} className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm" />
          <input name="mediator" defaultValue={mediator ?? ""} className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm" placeholder="Mediator profile ID" />
          <input name="creditor" defaultValue={creditor ?? ""} className="h-11 rounded-lg border border-[#D1D5DB] px-3 text-sm" placeholder="Creditor organization ID" />
          <Button type="submit" className="h-11 rounded-lg font-semibold md:col-span-4">กรองรายการ</Button>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold">รายการนัดหมายทั้งหมด</h2>
          <p className="mt-1 text-sm text-[#6B7280]">{sortedAppointments.length.toLocaleString("th-TH")} รายการ</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#F8FAFC] text-xs font-semibold uppercase text-[#6B7280]">
              <tr>
                <SortableTh basePath="/admin/appointments" label="เคส" keyName="case_number" currentSort={sort} dir={dir} params={{ status, date, mediator, creditor }} />
                <SortableTh basePath="/admin/appointments" label="วันเวลา" keyName="appointment_date" currentSort={sort} dir={dir} params={{ status, date, mediator, creditor }} />
                <th className="px-5 py-3">ผู้ไกล่เกลี่ย</th>
                <th className="px-5 py-3">เจ้าหนี้</th>
                <SortableTh basePath="/admin/appointments" label="สถานะ" keyName="status" currentSort={sort} dir={dir} params={{ status, date, mediator, creditor }} />
                <th className="px-5 py-3">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {sortedAppointments.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-[#6B7280]">ยังไม่มีนัดหมาย</td></tr>
              ) : pagedAppointments.map((appointment) => (
                <tr key={appointment.id} className="border-t border-black/5 align-top">
                  <td className="px-5 py-4 font-medium">{appointment.cases?.case_number ?? "-"}</td>
                  <td className="px-5 py-4">{formatAppointmentDateTime(appointment)}</td>
                  <td className="px-5 py-4">{appointment.mediator_profiles ? `${appointment.mediator_profiles.first_name} ${appointment.mediator_profiles.last_name}` : "-"}</td>
                  <td className="px-5 py-4">{appointment.creditor_organizations?.organization_name ?? appointment.cases?.creditor_name ?? "-"}</td>
                  <td className="px-5 py-4"><AppointmentStatusBadge status={appointment.status} /></td>
                  <td className="px-5 py-4">
                    <div className="grid min-w-72 gap-2">
                      <form action={adminUpdateMeetingUrl} className="flex gap-2">
                        <input type="hidden" name="appointment_id" value={appointment.id} />
                        <input name="meeting_url" defaultValue={appointment.meeting_url ?? ""} className="h-10 min-w-0 flex-1 rounded-lg border border-[#D1D5DB] px-3 text-sm" placeholder="Meeting URL" />
                        <Button type="submit" variant="outline" className="h-10 rounded-lg">บันทึก</Button>
                      </form>
                      <form action={adminForceReschedule} className="flex gap-2">
                        <input type="hidden" name="appointment_id" value={appointment.id} />
                        <input name="reason" className="h-10 min-w-0 flex-1 rounded-lg border border-[#D1D5DB] px-3 text-sm" placeholder="เหตุผลเลื่อนนัด" />
                        <Button type="submit" variant="outline" className="h-10 rounded-lg">เลื่อน</Button>
                      </form>
                      <form action={adminCancelAppointment} className="flex gap-2">
                        <input type="hidden" name="appointment_id" value={appointment.id} />
                        <input name="reason" className="h-10 min-w-0 flex-1 rounded-lg border border-[#D1D5DB] px-3 text-sm" placeholder="เหตุผลยกเลิก" />
                        <Button type="submit" variant="outline" className="h-10 rounded-lg">ยกเลิก</Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          basePath="/admin/appointments"
          params={{ status, date, mediator, creditor, sort, dir }}
          page={page}
          pageSize={pageSize}
          total={sortedAppointments.length}
        />
      </section>
    </AdminShell>
  );
}

function SortableTh({
  basePath,
  label,
  keyName,
  currentSort,
  dir,
  params,
}: {
  basePath: string;
  label: string;
  keyName: "case_number" | "appointment_date" | "status";
  currentSort: string;
  dir: "asc" | "desc";
  params: Record<string, string | undefined>;
}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) search.set(key, value);
  });
  search.set("sort", keyName);
  search.set("dir", currentSort === keyName && dir === "asc" ? "desc" : "asc");
  return (
    <th className="px-5 py-3">
      <Link href={`${basePath}?${search.toString()}`} className="inline-flex items-center gap-1 hover:text-[#111827]">
        {label}
        {currentSort === keyName ? <span>{dir === "asc" ? "↑" : "↓"}</span> : null}
      </Link>
    </th>
  );
}
