import { ShieldCheck } from "lucide-react";
import { PortalPage } from "@/components/portal-page";

export default function AdminPortalPage() {
  return (
    <PortalPage
      title="Admin Portal Preview"
      description="พื้นที่ตัวอย่างสำหรับผู้ดูแลระบบเพื่อกำกับดูแล KPI, audit trail, และภาพรวมการทำงานของระบบ"
      icon={ShieldCheck}
      accentClass="bg-gradient-to-br from-white to-[#FFF5C4]"
      highlights={["KPI ภาพรวม", "Audit และ compliance", "การกำกับคุณภาพการให้บริการ"]}
    />
  );
}
