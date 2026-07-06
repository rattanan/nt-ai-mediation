"use client";

import { useMemo, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatThaiDate, meetingTypeLabels, type AvailableSlotView } from "@/lib/appointment-shared";
import { cn } from "@/lib/utils";

const VISIBLE_SLOTS_PER_DAY = 4;
const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const WEEKDAY_LABELS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];

type DayGroup = {
  date: string;
  label: string;
  shortDate: string;
  slots: AvailableSlotView[];
};

type WeekGroup = {
  key: string;
  label: string;
  days: DayGroup[];
};

function toBangkokDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`);
}

function formatDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function addDays(value: string, days: number) {
  const next = toBangkokDate(value);
  next.setDate(next.getDate() + days);
  return formatDateKey(next);
}

function startOfWeek(value: string) {
  const date = toBangkokDate(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return formatDateKey(date);
}

function shortThaiDate(date: string) {
  return new Date(`${date}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    month: "short",
    day: "numeric",
  });
}

function weekLabel(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    month: "short",
    day: "numeric",
  });
  const end = new Date(`${endDate}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start} - ${end}`;
}

function buildWeekGroups(slots: AvailableSlotView[]): WeekGroup[] {
  const weeks = new Map<string, Map<string, AvailableSlotView[]>>();

  for (const slot of slots) {
    const weekKey = startOfWeek(slot.date);
    const dayMap = weeks.get(weekKey) ?? new Map<string, AvailableSlotView[]>();
    const daySlots = dayMap.get(slot.date) ?? [];
    daySlots.push(slot);
    dayMap.set(slot.date, daySlots);
    weeks.set(weekKey, dayMap);
  }

  return Array.from(weeks.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekKey, dayMap]) => {
      const days = WEEKDAY_ORDER.map((offset, index) => {
        const date = addDays(weekKey, index);
        const slotsForDay = [...(dayMap.get(date) ?? [])].sort((a, b) => a.startTime.localeCompare(b.startTime));
        return {
          date,
          label: WEEKDAY_LABELS[index],
          shortDate: shortThaiDate(date),
          slots: slotsForDay,
        };
      });

      return {
        key: weekKey,
        label: weekLabel(weekKey, addDays(weekKey, 6)),
        days,
      };
    });
}

export function SlotPicker({
  slots,
  action,
}: {
  slots: AvailableSlotView[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const weeks = useMemo(() => buildWeekGroups(slots), [slots]);
  const [selectedKey, setSelectedKey] = useState(slots[0]?.key ?? "");
  const [activeWeekKey, setActiveWeekKey] = useState(weeks[0]?.key ?? "");
  const [activeMobileDay, setActiveMobileDay] = useState(weeks[0]?.days.find((day) => day.slots.length > 0)?.date ?? weeks[0]?.days[0]?.date ?? "");
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  const slotByKey = useMemo(() => new Map(slots.map((slot) => [slot.key, slot])), [slots]);

  const firstSlotKey = weeks[0]?.days.flatMap((day) => day.slots)[0]?.key ?? "";
  const effectiveSelectedKey = selectedKey && slotByKey.has(selectedKey) ? selectedKey : firstSlotKey;
  const selectedSlot = effectiveSelectedKey ? slotByKey.get(effectiveSelectedKey) ?? null : null;
  const selectedWeekKey = selectedSlot ? startOfWeek(selectedSlot.date) : weeks[0]?.key ?? "";
  const effectiveActiveWeekKey = weeks.some((week) => week.key === activeWeekKey)
    ? activeWeekKey
    : selectedWeekKey;
  const activeWeekIndex = Math.max(0, weeks.findIndex((week) => week.key === effectiveActiveWeekKey));
  const activeWeek = weeks[activeWeekIndex] ?? weeks[0];
  const activeWeekFirstSlot = activeWeek?.days.flatMap((day) => day.slots)[0] ?? null;
  const visibleSelectedSlot = selectedSlot && activeWeek
    ? activeWeek.days.some((day) => day.slots.some((slot) => slot.key === selectedSlot.key))
    : false;
  const effectiveSlot = visibleSelectedSlot ? selectedSlot : activeWeekFirstSlot;
  const effectiveSlotKey = effectiveSlot?.key ?? effectiveSelectedKey;
  const mobileDayExists = activeWeek?.days.some((day) => day.date === activeMobileDay) ?? false;
  const effectiveMobileDay = mobileDayExists
    ? activeMobileDay
    : effectiveSlot?.date ?? activeWeek?.days.find((day) => day.slots.length > 0)?.date ?? activeWeek?.days[0]?.date ?? "";

  if (slots.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-white p-8 text-center">
        <CalendarClock className="mx-auto h-9 w-9 text-[#A87900]" />
        <p className="mt-3 font-semibold">ยังไม่มีเวลาว่างให้เลือก</p>
        <p className="mt-2 text-sm text-[#6B7280]">กรุณารอผู้ไกล่เกลี่ยเพิ่มช่วงเวลาว่าง หรือเลือกผู้ไกล่เกลี่ยรายอื่น</p>
      </div>
    );
  }

  const changeWeek = (nextIndex: number) => {
    const nextWeek = weeks[nextIndex];
    if (!nextWeek) return;
    setActiveWeekKey(nextWeek.key);
  };

  const toggleDayExpanded = (date: string) => {
    setExpandedDays((current) => ({ ...current, [date]: !current[date] }));
  };

  const renderSlotButton = (slot: AvailableSlotView) => {
    const selected = slot.key === effectiveSlotKey;
    return (
      <button
        key={slot.key}
        type="button"
        onClick={() => setSelectedKey(slot.key)}
        className={cn(
          "w-full rounded-md border px-3 py-2 text-left text-sm transition",
          selected
            ? "border-[#FFD200] bg-[#FFF8D9] text-[#111827] shadow-sm"
            : "border-[#E5E7EB] bg-white hover:border-[#F5B800]",
        )}
      >
        <span className="block font-semibold">{slot.startTime}-{slot.endTime}</span>
        <span className="mt-1 block text-xs text-[#6B7280]">{meetingTypeLabels[slot.meetingType]}</span>
      </button>
    );
  };

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="slot_key" value={effectiveSlotKey} />

      <section className="rounded-lg border border-black/5 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 border-b border-black/5 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#111827]">เลือกเวลานัดหมาย</p>
            <p className="mt-1 text-sm text-[#6B7280]">ดูตารางแบบรายสัปดาห์เพื่อเลือกช่วงเวลาที่สะดวกที่สุด</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 rounded-lg p-0"
              onClick={() => changeWeek(activeWeekIndex - 1)}
              disabled={activeWeekIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-[11rem] rounded-lg border border-black/5 bg-[#FFF8D9] px-4 py-2 text-center text-sm font-semibold text-[#8A6500]">
              {activeWeek?.label}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-10 w-10 rounded-lg p-0"
              onClick={() => changeWeek(activeWeekIndex + 1)}
              disabled={activeWeekIndex >= weeks.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-5 hidden lg:grid lg:grid-cols-7 lg:gap-3">
          {activeWeek.days.map((day) => {
            const expanded = expandedDays[day.date] ?? false;
            const visibleSlots = expanded ? day.slots : day.slots.slice(0, VISIBLE_SLOTS_PER_DAY);
            return (
              <section key={day.date} className="min-h-[18rem] rounded-lg border border-black/5 bg-[#FCFCFD] p-3">
                <div className="border-b border-black/5 pb-3">
                  <p className="text-sm font-semibold text-[#111827]">{day.label}</p>
                  <p className="mt-1 text-xs text-[#6B7280]">{day.shortDate}</p>
                </div>
                <div className="mt-3 space-y-2">
                  {visibleSlots.length > 0 ? visibleSlots.map(renderSlotButton) : (
                    <div className="rounded-md border border-dashed border-[#E5E7EB] bg-white px-3 py-6 text-center text-xs text-[#9CA3AF]">
                      ไม่มีเวลาว่าง
                    </div>
                  )}
                </div>
                {day.slots.length > VISIBLE_SLOTS_PER_DAY ? (
                  <button
                    type="button"
                    onClick={() => toggleDayExpanded(day.date)}
                    className="mt-3 text-xs font-semibold text-[#8A6500] hover:text-[#111827]"
                  >
                    {expanded ? "ย่อรายการ" : `ดูเพิ่ม ${day.slots.length - VISIBLE_SLOTS_PER_DAY} ช่วงเวลา`}
                  </button>
                ) : null}
              </section>
            );
          })}
        </div>

        <div className="mt-5 lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {activeWeek.days.map((day) => {
              const active = day.date === effectiveMobileDay;
              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setActiveMobileDay(day.date)}
                  className={cn(
                    "min-w-[4.75rem] rounded-lg border px-3 py-2 text-center text-sm transition",
                    active
                      ? "border-[#FFD200] bg-[#FFF8D9] text-[#8A6500]"
                      : "border-[#E5E7EB] bg-white text-[#374151]",
                  )}
                >
                  <span className="block font-semibold">{day.label}</span>
                  <span className="mt-1 block text-xs">{day.shortDate}</span>
                </button>
              );
            })}
          </div>

          {activeWeek.days
            .filter((day) => day.date === effectiveMobileDay)
            .map((day) => {
              const expanded = expandedDays[day.date] ?? false;
              const visibleSlots = expanded ? day.slots : day.slots.slice(0, VISIBLE_SLOTS_PER_DAY);
              return (
                <section key={day.date} className="mt-3 rounded-lg border border-black/5 bg-[#FCFCFD] p-4">
                  <div>
                    <p className="font-semibold text-[#111827]">{formatThaiDate(day.date)}</p>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {visibleSlots.length > 0 ? visibleSlots.map(renderSlotButton) : (
                      <div className="rounded-md border border-dashed border-[#E5E7EB] bg-white px-3 py-6 text-center text-sm text-[#9CA3AF]">
                        ไม่มีเวลาว่าง
                      </div>
                    )}
                  </div>
                  {day.slots.length > VISIBLE_SLOTS_PER_DAY ? (
                    <button
                      type="button"
                      onClick={() => toggleDayExpanded(day.date)}
                      className="mt-3 text-xs font-semibold text-[#8A6500] hover:text-[#111827]"
                    >
                      {expanded ? "ย่อรายการ" : `ดูเพิ่ม ${day.slots.length - VISIBLE_SLOTS_PER_DAY} ช่วงเวลา`}
                    </button>
                  ) : null}
                </section>
              );
            })}
        </div>
      </section>

      <section className="rounded-lg border border-black/5 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-[#6B7280]">เวลาที่เลือก</p>
            {effectiveSlot ? (
              <>
                <h3 className="mt-1 text-lg font-semibold text-[#111827]">{formatThaiDate(effectiveSlot.date)}</h3>
                <p className="mt-1 text-sm text-[#374151]">
                  {effectiveSlot.startTime}-{effectiveSlot.endTime} · {meetingTypeLabels[effectiveSlot.meetingType]}
                </p>
                {effectiveSlot.isRecurring ? <p className="mt-1 text-xs font-medium text-[#A87900]">ช่วงเวลานี้มาจาก Working Hours แบบรายสัปดาห์</p> : null}
              </>
            ) : (
              <p className="mt-1 text-sm text-[#9CA3AF]">กรุณาเลือกเวลาในตารางด้านบน</p>
            )}
          </div>
          <Button type="submit" className="h-11 w-full rounded-lg font-semibold sm:w-auto" disabled={!effectiveSlot}>
            ส่งคำขอนัดหมาย
          </Button>
        </div>
      </section>
    </form>
  );
}
