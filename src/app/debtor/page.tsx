import { FileText } from "lucide-react";
import { PortalPage } from "@/components/portal-page";

export default function DebtorPortalPage() {
  return (
    <PortalPage
      title="Debtor Portal Preview"
      description="พื้นที่ตัวอย่างสำหรับลูกหนี้เพื่อเริ่มต้นลงทะเบียน ตรวจสอบข้อมูลเคส และติดตามขั้นตอนการไกล่เกลี่ย"
      icon={FileText}
      accentClass="bg-gradient-to-br from-[#FFF9D7] to-white"
      highlights={["ลงทะเบียนเคสหนี้", "ตอบแบบสัมภาษณ์ AI", "ติดตามนัดหมายและผลการไกล่เกลี่ย"]}
    />
  );
}
