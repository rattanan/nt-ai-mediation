import { Gavel } from "lucide-react";
import { PortalPage } from "@/components/portal-page";

export default function MediatorPortalPage() {
  return (
    <PortalPage
      title="Mediator Portal Preview"
      description="พื้นที่ตัวอย่างสำหรับผู้ไกล่เกลี่ยเพื่อดูคิวงาน จัดการนัดหมาย และติดตามผลของแต่ละเคส"
      icon={Gavel}
      accentClass="bg-gradient-to-br from-white to-[#FFF4B3]"
      highlights={["คิวงานผู้ไกล่เกลี่ย", "รายละเอียดเคสและข้อมูลนัดหมาย", "สรุปผลการไกล่เกลี่ย"]}
    />
  );
}
