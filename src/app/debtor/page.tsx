import { CalendarClock, ClipboardList, FileText, Home, MessageSquareText, Scale, ShieldCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { PortalShell } from "@/components/portal-shell";

export const dynamic = "force-dynamic";

export default async function DebtorPortalPage() {
  const profile = await requireRole("debtor");

  return (
    <PortalShell
      roleLabel="Debtor Portal"
      title="แดชบอร์ดลูกหนี้"
      subtitle="ติดตามคำขอไกล่เกลี่ย การสัมภาษณ์ AI และข้อตกลงของคุณ"
      userName={profile.full_name}
      sidebarItems={[
        { label: "ภาพรวม", icon: Home, active: true },
        { label: "คำขอไกล่เกลี่ย", icon: FileText },
        { label: "สัมภาษณ์ AI", icon: MessageSquareText },
        { label: "นัดหมาย", icon: CalendarClock },
        { label: "ข้อตกลง", icon: Scale },
      ]}
      metrics={[
        { label: "จำนวนคำขอไกล่เกลี่ย", value: "0", caption: "ยังไม่มีคำขอที่ส่งเข้าสู่ระบบ", icon: ClipboardList },
        { label: "สถานะการสัมภาษณ์ AI", value: "รอเริ่ม", caption: "พร้อมเปิดใช้งานเมื่อเชื่อมต่อ auth", icon: MessageSquareText },
        { label: "นัดหมายถัดไป", value: "-", caption: "ยังไม่มีนัดหมายในระบบ", icon: CalendarClock },
        { label: "ข้อตกลงที่รอติดตาม", value: "0", caption: "ไม่มีข้อตกลงค้างติดตาม", icon: ShieldCheck },
      ]}
      table={{
        title: "รายการคำขอไกล่เกลี่ย",
        description: "ตาราง mock สำหรับแสดงคำขอและสถานะเมื่อต่อข้อมูลจริง",
        columns: ["เลขคำขอ", "เจ้าหนี้", "ยอดหนี้", "สถานะ", "อัปเดตล่าสุด"],
        actionLabel: "สร้างคำขอใหม่",
      }}
    />
  );
}
