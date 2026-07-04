import type { AppointmentStatus, MeetingProvider, MeetingType } from "@/types/database";

export type AvailableSlotView = {
  key: string;
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  meetingType: MeetingType;
  isRecurring: boolean;
  maxCasesPerDay: number;
  maxCasesPerMonth: number;
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  requested: "ส่งคำขอนัดหมาย",
  pending_confirmation: "รอยืนยันนัดหมาย",
  confirmed: "ยืนยันนัดหมายแล้ว",
  reschedule_requested: "ขอเลื่อนนัด",
  completed: "ไกล่เกลี่ยเสร็จสิ้น",
  cancelled: "ยกเลิกนัดหมาย",
  no_show: "ไม่เข้าร่วมตามนัด",
};

export const meetingTypeLabels: Record<MeetingType, string> = {
  online: "ออนไลน์",
  onsite: "พบที่สถานที่จริง",
  hybrid: "ออนไลน์/สถานที่จริง",
};

export const meetingProviderLabels: Record<MeetingProvider, string> = {
  manual_link: "ลิงก์ที่กรอกเอง",
  google_meet: "Google Meet",
  zoom: "Zoom",
  other: "อื่น ๆ",
};

export function formatThaiDate(date: string) {
  return new Date(`${date}T00:00:00+07:00`).toLocaleDateString("th-TH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
