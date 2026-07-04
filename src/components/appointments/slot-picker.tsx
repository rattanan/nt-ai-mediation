"use client";

import { useMemo, useState } from "react";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatThaiDate, meetingTypeLabels, type AvailableSlotView } from "@/lib/appointment-shared";

export function SlotPicker({
  slots,
  action,
}: {
  slots: AvailableSlotView[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [selectedKey, setSelectedKey] = useState(slots[0]?.key ?? "");
  const grouped = useMemo(() => {
    return slots.reduce<Record<string, AvailableSlotView[]>>((acc, slot) => {
      acc[slot.date] = acc[slot.date] ?? [];
      acc[slot.date].push(slot);
      return acc;
    }, {});
  }, [slots]);

  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white p-8 text-center">
        <CalendarClock className="mx-auto h-9 w-9 text-[#A87900]" />
        <p className="mt-3 font-semibold">ยังไม่มีเวลาว่างให้เลือก</p>
        <p className="mt-2 text-sm text-[#6B7280]">กรุณารอผู้ไกล่เกลี่ยเพิ่มช่วงเวลาว่าง หรือเลือกผู้ไกล่เกลี่ยรายอื่น</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="slot_key" value={selectedKey} />
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.entries(grouped).map(([date, daySlots]) => (
          <section key={date} className="rounded-lg border border-black/5 bg-white p-4 shadow-sm">
            <h3 className="font-semibold">{formatThaiDate(date)}</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {daySlots.map((slot) => {
                const selected = slot.key === selectedKey;
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => setSelectedKey(slot.key)}
                    className={`min-h-20 rounded-lg border px-3 py-2 text-left text-sm transition ${
                      selected
                        ? "border-[#FFD200] bg-[#FFF8D9] shadow-sm"
                        : "border-[#E5E7EB] bg-white hover:border-[#F5B800]"
                    }`}
                  >
                    <span className="block font-semibold">{slot.startTime}-{slot.endTime}</span>
                    <span className="mt-1 block text-xs text-[#6B7280]">{meetingTypeLabels[slot.meetingType]}</span>
                    {slot.isRecurring ? <span className="mt-1 block text-xs text-[#A87900]">ทุกสัปดาห์</span> : null}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <Button type="submit" className="h-11 w-full rounded-lg font-semibold sm:w-auto">
        ส่งคำขอนัดหมาย
      </Button>
    </form>
  );
}
