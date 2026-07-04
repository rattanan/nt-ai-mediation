import Link from "next/link";
import { CalendarCheck2, ClipboardCheck, Gavel, TrendingUp, UserCheck } from "lucide-react";
import { createAvailabilitySlot, disableAvailabilitySlot, updateAvailabilitySlot } from "@/app/mediator/actions";
import { AppointmentSummaryCard } from "@/components/appointments/appointment-summary-card";
import { requireRole } from "@/lib/auth/server";
import { PortalShell } from "@/components/portal-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppointmentsForMediator, getMediatorAvailabilitySlots, isUpcomingAppointment, meetingTypeLabels } from "@/lib/appointments";
import { getMediatorAvailability, getMediatorProfileByUser, mediatorStatusLabels } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MediatorPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const authProfile = await requireRole("mediator");
  const { success, error } = await searchParams;
  const mediatorProfile = await getMediatorProfileByUser(authProfile.id);
  const availability = await getMediatorAvailability(mediatorProfile?.id);
  const assignedCases = mediatorProfile ? await getAssignedCases(mediatorProfile.id) : [];
  const appointments = mediatorProfile ? await getAppointmentsForMediator(mediatorProfile.id) : [];
  const availabilitySlots = mediatorProfile ? await getMediatorAvailabilitySlots(mediatorProfile.id) : [];

  if (!mediatorProfile || mediatorProfile.status !== "approved") {
    return (
      <PortalShell
        roleLabel="Mediator Portal"
        title="ตั้งค่าโปรไฟล์ผู้ไกล่เกลี่ย"
        subtitle="กรอกข้อมูลประวัติ คุณสมบัติ และพื้นที่ให้บริการเพื่อส่งให้ผู้ดูแลระบบตรวจสอบ"
        userName={authProfile.full_name}
        sidebarItems={[{ label: "โปรไฟล์", icon: UserCheck, active: true }]}
        metrics={[
          { label: "สถานะโปรไฟล์", value: mediatorProfile ? mediatorStatusLabels[mediatorProfile.status] : "ยังไม่สร้าง", caption: "ต้องได้รับอนุมัติก่อนแสดงต่อผู้ใช้", icon: UserCheck },
          { label: "เคสที่ได้รับมอบหมาย", value: "0", caption: "เริ่มแสดงหลังอนุมัติ", icon: Gavel },
          { label: "เวลาว่าง", value: availability?.active ? "เปิด" : "ปิด", caption: "ตั้งค่าได้ในโปรไฟล์", icon: CalendarCheck2 },
          { label: "อัตราสำเร็จ", value: "0%", caption: "คำนวณจากเคสจริง", icon: TrendingUp },
        ]}
        table={{ title: "สถานะการตรวจสอบ", description: "ระบบจะแสดงหมายเหตุจากผู้ดูแลเมื่อมีการขอแก้ไข", columns: ["รายการ", "สถานะ"], actionLabel: "เปิดโปรไฟล์" }}
      >
        {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
        {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
        <section className="mt-6 rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge>{mediatorProfile ? mediatorStatusLabels[mediatorProfile.status] : "ยังไม่สร้างโปรไฟล์"}</Badge>
              <h2 className="mt-3 text-xl font-semibold">โปรไฟล์ต้องได้รับการอนุมัติก่อนเปิดรับงาน</h2>
              {mediatorProfile?.admin_review_note ? <p className="mt-2 text-sm leading-6 text-[#B45309]">{mediatorProfile.admin_review_note}</p> : null}
            </div>
            <Button href="/mediator/profile" className="rounded-lg font-semibold">กรอก/แก้ไขโปรไฟล์</Button>
          </div>
        </section>
      </PortalShell>
    );
  }

  const successRate = mediatorProfile.total_cases_handled > 0
    ? Math.round((mediatorProfile.successful_cases / mediatorProfile.total_cases_handled) * 100)
    : 0;
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const todayAppointments = appointments.filter((appointment) => appointment.appointment_date === today && isUpcomingAppointment(appointment));
  const upcomingAppointments = appointments.filter(isUpcomingAppointment).slice(0, 4);
  const pendingAppointments = appointments.filter((appointment) => appointment.status === "pending_confirmation" && !appointment.confirmed_by_mediator_at);

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="แดชบอร์ดผู้ไกล่เกลี่ย"
      subtitle="จัดการเคสที่ได้รับมอบหมายและเวลาว่างของคุณ"
      userName={authProfile.full_name}
      sidebarItems={[{ label: "ภาพรวม", icon: UserCheck, active: true }, { label: "โปรไฟล์", icon: ClipboardCheck }]}
      metrics={[
        { label: "เคสที่ได้รับมอบหมาย", value: String(assignedCases.length), caption: "เคสที่เลือกคุณเป็นผู้ไกล่เกลี่ย", icon: Gavel },
        { label: "นัดวันนี้", value: String(todayAppointments.length), caption: "นัดไกล่เกลี่ยวันนี้", icon: CalendarCheck2 },
        { label: "รอยืนยัน", value: String(pendingAppointments.length), caption: "นัดหมายที่รอคุณยืนยัน", icon: ClipboardCheck },
        { label: "อัตราสำเร็จ", value: `${successRate}%`, caption: "จากประวัติที่แจ้ง", icon: TrendingUp },
      ]}
      table={{ title: "เคสที่ได้รับมอบหมาย", description: "รายการเคสที่ลูกหนี้เลือกคุณเป็นผู้ไกล่เกลี่ย", columns: ["เลขเคส", "เจ้าหนี้", "ยอดหนี้", "สถานะ"], actionLabel: "ดูคิวงาน" }}
    >
      <section className="mt-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge>{mediatorStatusLabels[mediatorProfile.status]}</Badge>
            <h2 className="mt-3 text-xl font-semibold">{mediatorProfile.title ?? ""} {mediatorProfile.first_name} {mediatorProfile.last_name}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">{mediatorProfile.profile_summary || "ยังไม่มีสรุปโปรไฟล์"}</p>
          </div>
          <Button href="/mediator/profile" variant="outline" className="rounded-lg font-semibold">แก้ไขโปรไฟล์</Button>
        </div>
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">นัดหมายรอยืนยัน</h2>
            <div className="mt-4 space-y-3">
              {pendingAppointments.length === 0 ? <p className="text-sm text-[#6B7280]">ไม่มีนัดหมายรอยืนยัน</p> : pendingAppointments.map((appointment) => (
                <AppointmentSummaryCard key={appointment.id} appointment={appointment} detailHref={`/mediator/appointments/${appointment.id}`} />
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">นัดหมายที่กำลังจะถึง</h2>
            <div className="mt-4 space-y-3">
              {upcomingAppointments.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีนัดหมายที่กำลังจะถึง</p> : upcomingAppointments.map((appointment) => (
                <Link key={appointment.id} href={`/mediator/appointments/${appointment.id}`} className="block rounded-lg bg-[#F8FAFC] p-3 hover:bg-[#FFF8D9]">
                  <p className="font-medium">เคส {appointment.cases?.case_number ?? "-"}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">{appointment.appointment_date} {appointment.start_time.slice(0, 5)}-{appointment.end_time.slice(0, 5)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">จัดการเวลาว่าง</h2>
          <form action={createAvailabilitySlot} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">วันที่เฉพาะ
              <input name="slot_date" type="date" className="mt-1 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
            </label>
            <label className="text-sm font-medium">ซ้ำทุกสัปดาห์
              <select name="day_of_week" className="mt-1 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm">
                <option value="">ไม่ซ้ำ</option>
                <option value="1">จันทร์</option>
                <option value="2">อังคาร</option>
                <option value="3">พุธ</option>
                <option value="4">พฤหัสบดี</option>
                <option value="5">ศุกร์</option>
                <option value="6">เสาร์</option>
                <option value="0">อาทิตย์</option>
              </select>
            </label>
            <label className="text-sm font-medium">เริ่ม
              <input name="start_time" type="time" required className="mt-1 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
            </label>
            <label className="text-sm font-medium">สิ้นสุด
              <input name="end_time" type="time" required className="mt-1 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input name="is_recurring" type="checkbox" className="h-4 w-4" />
              ใช้เป็นเวลาประจำทุกสัปดาห์
            </label>
            <label className="text-sm font-medium">รูปแบบ
              <select name="meeting_type" defaultValue="online" className="mt-1 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm">
                <option value="online">ออนไลน์</option>
                <option value="onsite">สถานที่จริง</option>
                <option value="hybrid">ผสม</option>
              </select>
            </label>
            <label className="text-sm font-medium">สูงสุดต่อวัน
              <input name="max_cases_per_day" type="number" min="1" defaultValue="3" className="mt-1 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
            </label>
            <label className="text-sm font-medium">สูงสุดต่อเดือน
              <input name="max_cases_per_month" type="number" min="1" defaultValue="20" className="mt-1 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm" />
            </label>
            <label className="text-sm font-medium sm:col-span-2">หมายเหตุ
              <textarea name="note" className="mt-1 min-h-20 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" />
            </label>
            <Button type="submit" className="h-11 rounded-lg font-semibold sm:col-span-2">เพิ่มเวลาว่าง</Button>
          </form>

          <div className="mt-5 space-y-3">
            {availabilitySlots.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีเวลาว่าง</p> : availabilitySlots.map((slot) => (
              <form key={slot.id} action={updateAvailabilitySlot} className="rounded-lg bg-[#F8FAFC] p-3">
                <input type="hidden" name="slot_id" value={slot.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <p className="text-sm font-semibold">{slot.is_recurring ? `ทุกสัปดาห์ วัน ${slot.day_of_week}` : slot.slot_date} · {slot.active ? "เปิด" : "ปิด"}</p>
                  <p className="text-sm text-[#6B7280]">{meetingTypeLabels[slot.meeting_type]}</p>
                  <input name="start_time" type="time" defaultValue={slot.start_time.slice(0, 5)} className="h-10 rounded-lg border border-[#D1D5DB] px-3 text-sm" />
                  <input name="end_time" type="time" defaultValue={slot.end_time.slice(0, 5)} className="h-10 rounded-lg border border-[#D1D5DB] px-3 text-sm" />
                  <input name="max_cases_per_day" type="number" min="1" defaultValue={slot.max_cases_per_day} className="h-10 rounded-lg border border-[#D1D5DB] px-3 text-sm" />
                  <input name="max_cases_per_month" type="number" min="1" defaultValue={slot.max_cases_per_month} className="h-10 rounded-lg border border-[#D1D5DB] px-3 text-sm" />
                  <select name="meeting_type" defaultValue={slot.meeting_type} className="h-10 rounded-lg border border-[#D1D5DB] px-3 text-sm">
                    <option value="online">ออนไลน์</option>
                    <option value="onsite">สถานที่จริง</option>
                    <option value="hybrid">ผสม</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm"><input name="active" type="checkbox" defaultChecked={slot.active} /> เปิดใช้งาน</label>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button type="submit" variant="outline" className="h-10 rounded-lg">บันทึก</Button>
                  <button formAction={disableAvailabilitySlot} className="inline-flex h-10 items-center rounded-lg border border-[#D1D5DB] px-4 text-sm font-semibold hover:bg-white">ปิด slot</button>
                </div>
              </form>
            ))}
          </div>
        </section>
      </section>
    </PortalShell>
  );
}

async function getAssignedCases(mediatorProfileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("cases").select("*").eq("selected_mediator_profile_id", mediatorProfileId).order("updated_at", { ascending: false });
  return data ?? [];
}
