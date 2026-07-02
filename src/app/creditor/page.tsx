import { BadgeCheck, Banknote, CalendarClock, ClipboardList, Home, Landmark, Scale } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";

export default function CreditorPortalPage() {
  return (
    <PortalShell
      roleLabel="Creditor Portal"
      title="แดชบอร์ดเจ้าหนี้"
      subtitle="ติดตามเคสที่เข้าสู่กระบวนการ นัดหมายเจรจา และข้อตกลงที่ต้องอนุมัติ"
      sidebarItems={[
        { label: "ภาพรวม", icon: Home, active: true },
        { label: "เคสลูกหนี้", icon: ClipboardList },
        { label: "นัดหมายเจรจา", icon: CalendarClock },
        { label: "ข้อตกลง", icon: Scale },
        { label: "องค์กรเจ้าหนี้", icon: Landmark },
      ]}
      metrics={[
        { label: "เคสที่รอพิจารณา", value: "0", caption: "ยังไม่มีเคสใหม่", icon: ClipboardList },
        { label: "นัดหมายเจรจา", value: "0", caption: "ไม่มีนัดหมายที่กำลังจะมาถึง", icon: CalendarClock },
        { label: "ข้อตกลงที่รออนุมัติ", value: "0", caption: "ไม่มีข้อตกลงรออนุมัติ", icon: BadgeCheck },
        { label: "ยอดหนี้ที่เข้าสู่กระบวนการ", value: "฿0", caption: "รอข้อมูลจากเคสจริง", icon: Banknote },
      ]}
      table={{
        title: "รายการเคสเจ้าหนี้",
        description: "ตาราง mock สำหรับติดตามเคสลูกหนี้ที่เข้าสู่กระบวนการ",
        columns: ["เลขเคส", "ลูกหนี้", "ยอดหนี้", "ผู้ไกล่เกลี่ย", "สถานะ"],
        actionLabel: "ส่งออกรายงาน",
      }}
    />
  );
}
