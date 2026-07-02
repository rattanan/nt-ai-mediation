import { CalendarCheck2, ClipboardCheck, ClipboardList, Gavel, Home, TrendingUp, Users2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";

export default function MediatorPortalPage() {
  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="แดชบอร์ดผู้ไกล่เกลี่ย"
      subtitle="จัดการเคสที่ได้รับมอบหมาย นัดหมาย และการสรุปผลการไกล่เกลี่ย"
      sidebarItems={[
        { label: "ภาพรวม", icon: Home, active: true },
        { label: "เคสของฉัน", icon: ClipboardList },
        { label: "ปฏิทินนัดหมาย", icon: CalendarCheck2 },
        { label: "สรุปผล", icon: ClipboardCheck },
        { label: "คู่กรณี", icon: Users2 },
      ]}
      metrics={[
        { label: "เคสที่ได้รับมอบหมาย", value: "0", caption: "ยังไม่มีเคสที่มอบหมาย", icon: Gavel },
        { label: "นัดหมายวันนี้", value: "0", caption: "ไม่มีนัดหมายสำหรับวันนี้", icon: CalendarCheck2 },
        { label: "เคสรอสรุปผล", value: "0", caption: "ไม่มีรายการค้างสรุป", icon: ClipboardCheck },
        { label: "อัตราปิดเคสสำเร็จ", value: "0%", caption: "รอข้อมูลจากเคสจริง", icon: TrendingUp },
      ]}
      table={{
        title: "เคสที่ได้รับมอบหมาย",
        description: "ตาราง mock สำหรับคิวงานผู้ไกล่เกลี่ย",
        columns: ["เลขเคส", "ลูกหนี้", "เจ้าหนี้", "วันนัดหมาย", "สถานะ"],
        actionLabel: "ดูคิวงาน",
      }}
    />
  );
}
