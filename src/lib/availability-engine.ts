import "server-only";

import { createClient } from "@/lib/supabase/server";

type WorkingHoursRow = {
  weekday: number;
  is_enabled: boolean;
  start_time: string | null;
  end_time: string | null;
  break_start: string | null;
  break_end: string | null;
  slot_duration_minutes: number;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
};

export type GeneratedAvailabilitySlot = {
  date: string;
  start: string;
  end: string;
  weekday: number;
};

function toMinutes(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function toTime(minutes: number) {
  const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
  const mins = Math.max(0, minutes % 60).toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

function normalizeDate(date: string) {
  return new Date(`${date}T00:00:00+07:00`);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getWeekday(date: Date) {
  return date.getDay();
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function overlapsBreak(start: number, end: number, breakStart: number | null, breakEnd: number | null) {
  if (breakStart === null || breakEnd === null) return false;
  return start < breakEnd && end > breakStart;
}

export async function generateAvailableSlots(mediatorId: string, startDate: string, endDate: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mediator_working_hours")
    .select("*")
    .eq("mediator_id", mediatorId);

  if (error || !data?.length) return [];

  const rules = data as unknown as WorkingHoursRow[];
  const start = normalizeDate(startDate);
  const end = normalizeDate(endDate);
  const slots: GeneratedAvailabilitySlot[] = [];

  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    const weekday = getWeekday(cursor);
    const rule = rules.find((item) => item.weekday === weekday && item.is_enabled);
    if (!rule) continue;

    const startMinutes = toMinutes(rule.start_time);
    const endMinutes = toMinutes(rule.end_time);
    const breakStartMinutes = toMinutes(rule.break_start);
    const breakEndMinutes = toMinutes(rule.break_end);
    const duration = rule.slot_duration_minutes;
    const bufferBefore = Math.max(0, rule.buffer_before_minutes);
    const bufferAfter = Math.max(0, rule.buffer_after_minutes);

    if (
      startMinutes === null ||
      endMinutes === null ||
      duration <= 0 ||
      endMinutes <= startMinutes
    ) {
      continue;
    }

    let current = startMinutes;
    while (current + duration <= endMinutes) {
      const slotStart = current;
      const slotEnd = current + duration;
      const adjustedStart = slotStart - bufferBefore;
      const adjustedEnd = slotEnd + bufferAfter;
      const withinWorkingHours = adjustedStart >= startMinutes && adjustedEnd <= endMinutes;
      const crossesBreak = overlapsBreak(adjustedStart, adjustedEnd, breakStartMinutes, breakEndMinutes);

      if (withinWorkingHours && !crossesBreak) {
        slots.push({
          date: formatDate(cursor),
          start: toTime(slotStart),
          end: toTime(slotEnd),
          weekday,
        });
      }

      current += duration + bufferBefore + bufferAfter;
    }
  }

  return slots;
}
