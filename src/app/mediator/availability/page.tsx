import { Clock } from "lucide-react";
import { createAvailabilitySlot, disableAvailabilitySlot, updateAvailabilitySlot } from "@/app/mediator/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PortalShell } from "@/components/portal-shell";
import { getMediatorAvailabilitySlots, meetingTypeLabels } from "@/lib/appointments";
import { requireRole } from "@/lib/auth/server";
import { mediatorSidebar } from "@/lib/mediator-portal";
import { getMediatorProfileByUser } from "@/lib/mediators";

export const dynamic = "force-dynamic";

export default async function MediatorAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const authProfile = await requireRole("mediator");
  const { success, error } = await searchParams;
  const mediatorProfile = await getMediatorProfileByUser(authProfile.id);
  const availabilitySlots = mediatorProfile ? await getMediatorAvailabilitySlots(mediatorProfile.id) : [];
  const activeSlots = availabilitySlots.filter((slot) => slot.active).length;
  const recurringSlots = availabilitySlots.filter((slot) => slot.is_recurring).length;

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="จัดการเวลาว่าง"
      subtitle="เพิ่ม แก้ไข และปิด slot นัดหมายสำหรับการไกล่เกลี่ย"
      userName={authProfile.full_name}
      sidebarItems={mediatorSidebar("/mediator/availability")}
      metrics={[
        { label: "เวลาว่างทั้งหมด", value: String(availabilitySlots.length), caption: "slot ที่สร้างไว้ทั้งหมด", icon: Clock },
        { label: "เปิดใช้งาน", value: String(activeSlots), caption: "ลูกหนี้สามารถเลือกได้", icon: Clock },
        { label: "เวลาประจำ", value: String(recurringSlots), caption: "slot แบบ recurring weekly", icon: Clock },
      ]}
      table={{ title: "", description: "", columns: [], actionLabel: "" }}
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <section className="mt-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">เพิ่มเวลาว่าง</h2>
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
      </section>

      <section className="mt-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">รายการเวลาว่าง</h2>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
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
    </PortalShell>
  );
}
