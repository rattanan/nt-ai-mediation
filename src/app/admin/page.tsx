import { Activity, AlertTriangle, ClipboardList, FileSearch, Gauge, Home, Users2 } from "lucide-react";
import { PortalShell } from "@/components/portal-shell";

export default function AdminPortalPage() {
  return (
    <PortalShell
      roleLabel="Admin Portal"
      title="แดชบอร์ดผู้ดูแลระบบ"
      subtitle="กำกับดูแลภาพรวมเคส Matching, SLA และ audit ของแพลตฟอร์ม"
      sidebarItems={[
        { label: "ภาพรวม", icon: Home, active: true },
        { label: "จัดการเคส", icon: ClipboardList },
        { label: "Matching", icon: Users2 },
        { label: "SLA", icon: Gauge },
        { label: "Audit Log", icon: FileSearch },
      ]}
      metrics={[
        { label: "จำนวนเคสทั้งหมด", value: "0", caption: "ยังไม่มีข้อมูลเคสจริง", icon: ClipboardList },
        { label: "เคสรอ Matching", value: "0", caption: "ไม่มีเคสรอจับคู่", icon: Users2 },
        { label: "SLA เกินกำหนด", value: "0", caption: "ไม่มีรายการเกินกำหนด", icon: AlertTriangle },
        { label: "Audit ล่าสุด", value: "-", caption: "รอ event จากระบบจริง", icon: Activity },
      ]}
      table={{
        title: "รายการตรวจสอบระบบ",
        description: "ตาราง mock สำหรับ audit และการกำกับดูแลคุณภาพการให้บริการ",
        columns: ["เวลา", "ผู้ดำเนินการ", "กิจกรรม", "ตารางข้อมูล", "ผลลัพธ์"],
        actionLabel: "ดู Audit",
      }}
    />
  );
}
