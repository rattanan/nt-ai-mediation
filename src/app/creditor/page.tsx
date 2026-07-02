import { ClipboardList } from "lucide-react";
import { PortalPage } from "@/components/portal-page";

export default function CreditorPortalPage() {
  return (
    <PortalPage
      title="Creditor Portal Preview"
      description="พื้นที่ตัวอย่างสำหรับเจ้าหนี้เพื่อดูภาพรวมลูกหนี้ สถานะการติดตาม และผลลัพธ์การปิดเรื่อง"
      icon={ClipboardList}
      accentClass="bg-gradient-to-br from-[#FFF8D9] to-white"
      highlights={["รายการเคสคงค้าง", "สถานะนัดหมายและ settlement", "รายงานภาพรวมเพื่อการตัดสินใจ"]}
    />
  );
}
