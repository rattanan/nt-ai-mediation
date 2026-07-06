import { CalendarDays, Clock } from "lucide-react";
import { saveWorkingHours, seedDefaultWorkingHours } from "@/app/mediator/actions";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PortalShell } from "@/components/portal-shell";
import { Pagination, getPage, paginateItems } from "@/components/ui/pagination";
import { requireRole } from "@/lib/auth/server";
import { generateAvailableSlots } from "@/lib/availability-engine";
import { mediatorSidebar } from "@/lib/mediator-portal";
import { getMediatorProfileByUser, getMediatorWorkingHours } from "@/lib/mediators";

export const dynamic = "force-dynamic";

const weekdayLabels = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

export default async function MediatorAvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; page?: string }>;
}) {
  const authProfile = await requireRole("mediator");
  const { success, error, page: pageParam } = await searchParams;
  const mediatorProfile = await getMediatorProfileByUser(authProfile.id);
  const workingHours = mediatorProfile ? await getMediatorWorkingHours(mediatorProfile.id) : [];
  const slots = mediatorProfile ? await generateAvailableSlots(mediatorProfile.id, todayString(), addDays(todayString(), 14)) : [];
  const pageSize = 6;
  const { page, pageItems: pagedSlots, total } = paginateItems(slots, getPage(pageParam), pageSize);
  const hoursByWeekday = new Map(workingHours.map((row) => [row.weekday, row]));
  const activeDays = workingHours.filter((row) => row.is_enabled).length;

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="Working Hours"
      subtitle="กำหนดตารางเวลาประจำสัปดาห์ครั้งเดียว แล้วระบบจะสร้างช่วงเวลานัดหมายให้อัตโนมัติ"
      userName={authProfile.full_name}
      sidebarItems={mediatorSidebar("/mediator/availability")}
      metrics={[
        { label: "วันเปิดใช้งาน", value: String(activeDays), caption: "วันในสัปดาห์ที่รับนัดหมาย", icon: Clock },
        { label: "slot preview", value: String(slots.length), caption: "ช่วงเวลาที่ระบบคำนวณได้", icon: CalendarDays },
        {
          label: "status",
          value: mediatorProfile ? "พร้อมตั้งค่า" : "ยังไม่มีโปรไฟล์",
          caption: mediatorProfile ? "ตั้งค่า Working Hours ได้ทันที" : "ต้องสร้างโปรไฟล์ผู้ไกล่เกลี่ยก่อน",
          icon: Clock,
        },
      ]}
      table={{ title: "", description: "", columns: [], actionLabel: "" }}
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-black/5 pb-4">
          <h2 className="text-lg font-semibold">Weekly Schedule</h2>
          <p className="text-sm text-[#6B7280]">เปิดวันไหนให้ติ๊ก แล้วระบุเวลาทำงาน พักเที่ยง slot duration และ buffer</p>
        </div>

        <form action={seedDefaultWorkingHours} className="mt-4">
          <Button type="submit" variant="outline" className="rounded-lg font-semibold">Load Default Week</Button>
        </form>

        <form action={saveWorkingHours} className="mt-5 space-y-4">
          {weekdayLabels.map((label, weekday) => {
            const row = hoursByWeekday.get(weekday);
            const enabled = row?.is_enabled ?? (weekday >= 1 && weekday <= 5);

            return (
              <div key={weekday} className="rounded-lg border border-black/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex items-center gap-3 font-semibold">
                    <input name={`weekday_${weekday}_enabled`} type="checkbox" defaultChecked={enabled} className="h-4 w-4" />
                    {label}
                  </label>
                  <Badge>{enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}</Badge>
                </div>

                {enabled ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-4">
                    <Field label="Start" name={`weekday_${weekday}_start`} type="time" defaultValue={row?.start_time ?? (weekday === 5 ? "08:30" : "08:30")} />
                    <Field label="End" name={`weekday_${weekday}_end`} type="time" defaultValue={row?.end_time ?? (weekday === 5 ? "16:30" : "17:00")} />
                    <Field label="Lunch start" name={`weekday_${weekday}_break_start`} type="time" defaultValue={row?.break_start ?? "12:00"} />
                    <Field label="Lunch end" name={`weekday_${weekday}_break_end`} type="time" defaultValue={row?.break_end ?? "13:00"} />
                    <Field label="Slot duration (min)" name={`weekday_${weekday}_slot_duration`} type="number" defaultValue={row?.slot_duration_minutes ?? 60} />
                    <Field label="Buffer before" name={`weekday_${weekday}_buffer_before`} type="number" defaultValue={row?.buffer_before_minutes ?? 15} />
                    <Field label="Buffer after" name={`weekday_${weekday}_buffer_after`} type="number" defaultValue={row?.buffer_after_minutes ?? 15} />
                  </div>
                ) : null}
              </div>
            );
          })}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" className="rounded-lg font-semibold">Save Working Hours</Button>
            <Button type="reset" variant="outline" className="rounded-lg font-semibold">Reset</Button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-black/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Preview Weekly Calendar</h2>
            <p className="text-sm text-[#6B7280]">ตัวอย่างช่วงเวลาที่ระบบจะส่งให้ debtor เลือก</p>
          </div>
          <Badge>{total.toLocaleString("th-TH")} slots</Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {pagedSlots.length === 0 ? (
            <p className="text-sm text-[#6B7280]">ยังไม่มีช่วงเวลาที่ generate ได้</p>
          ) : pagedSlots.map((slot) => (
            <div key={`${slot.date}-${slot.start}`} className="rounded-lg border border-black/5 bg-[#F8FAFC] p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold">{formatDisplayDate(slot.date)}</p>
                <Badge>{slot.weekday}</Badge>
              </div>
              <p className="mt-2 text-sm text-[#6B7280]">{slot.start} - {slot.end}</p>
            </div>
          ))}
        </div>
        <Pagination basePath="/mediator/availability" params={{}} page={page} pageSize={pageSize} total={total} />
      </section>
    </PortalShell>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue: string | number;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="mt-1 h-11 w-full rounded-lg border border-[#D1D5DB] px-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
      />
    </label>
  );
}

function todayString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00+07:00`);
  value.setDate(value.getDate() + days);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function formatDisplayDate(date: string) {
  return new Date(`${date}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
