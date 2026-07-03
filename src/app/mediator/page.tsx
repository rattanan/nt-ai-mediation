import { CalendarCheck2, ClipboardCheck, Gavel, TrendingUp, UserCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { PortalShell } from "@/components/portal-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getMediatorAvailability, getMediatorProfileByUser, mediatorStatusLabels } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MediatorPortalPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const authProfile = await requireRole("mediator");
  const { success, error } = await searchParams;
  const mediatorProfile = await getMediatorProfileByUser(authProfile.id);
  const availability = await getMediatorAvailability(mediatorProfile?.id);
  const assignedCases = mediatorProfile ? await getAssignedCases(mediatorProfile.id) : [];

  if (!mediatorProfile || mediatorProfile.status !== "approved") {
    return (
      <PortalShell
        roleLabel="Mediator Portal"
        title="ตั้งค่าโปรไฟล์ผู้ไกล่เกลี่ย"
        subtitle="กรอกข้อมูลประวัติ คุณสมบัติ และพื้นที่ให้บริการเพื่อส่งให้ผู้ดูแลระบบตรวจสอบ"
        userName={authProfile.full_name}
        sidebarItems={[{ label: "โปรไฟล์", icon: UserCheck, active: true }]}
        metrics={[
          { label: "สถานะโปรไฟล์", value: mediatorProfile ? mediatorStatusLabels[mediatorProfile.status] : "ยังไม่สร้าง", caption: "ต้องได้รับอนุมัติก่อนแสดงต่อผู้ใช้", icon: UserCheck },
          { label: "เคสที่ได้รับมอบหมาย", value: "0", caption: "เริ่มแสดงหลังอนุมัติ", icon: Gavel },
          { label: "เวลาว่าง", value: availability?.active ? "เปิด" : "ปิด", caption: "ตั้งค่าได้ในโปรไฟล์", icon: CalendarCheck2 },
          { label: "อัตราสำเร็จ", value: "0%", caption: "คำนวณจากเคสจริง", icon: TrendingUp },
        ]}
        table={{ title: "สถานะการตรวจสอบ", description: "ระบบจะแสดงหมายเหตุจากผู้ดูแลเมื่อมีการขอแก้ไข", columns: ["รายการ", "สถานะ"], actionLabel: "เปิดโปรไฟล์" }}
      >
        {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
        {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
        <section className="mt-6 rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge>{mediatorProfile ? mediatorStatusLabels[mediatorProfile.status] : "ยังไม่สร้างโปรไฟล์"}</Badge>
              <h2 className="mt-3 text-xl font-semibold">โปรไฟล์ต้องได้รับการอนุมัติก่อนเปิดรับงาน</h2>
              {mediatorProfile?.admin_review_note ? <p className="mt-2 text-sm leading-6 text-[#B45309]">{mediatorProfile.admin_review_note}</p> : null}
            </div>
            <Button href="/mediator/profile" className="rounded-lg font-semibold">กรอก/แก้ไขโปรไฟล์</Button>
          </div>
        </section>
      </PortalShell>
    );
  }

  const successRate = mediatorProfile.total_cases_handled > 0
    ? Math.round((mediatorProfile.successful_cases / mediatorProfile.total_cases_handled) * 100)
    : 0;

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="แดชบอร์ดผู้ไกล่เกลี่ย"
      subtitle="จัดการเคสที่ได้รับมอบหมายและเวลาว่างของคุณ"
      userName={authProfile.full_name}
      sidebarItems={[{ label: "ภาพรวม", icon: UserCheck, active: true }, { label: "โปรไฟล์", icon: ClipboardCheck }]}
      metrics={[
        { label: "เคสที่ได้รับมอบหมาย", value: String(assignedCases.length), caption: "เคสที่เลือกคุณเป็นผู้ไกล่เกลี่ย", icon: Gavel },
        { label: "เปิดรับงาน", value: availability?.active ? "ใช่" : "ไม่", caption: "ตั้งค่าในโปรไฟล์", icon: CalendarCheck2 },
        { label: "เคสที่เคยดูแล", value: String(mediatorProfile.total_cases_handled), caption: "ข้อมูลจากโปรไฟล์", icon: ClipboardCheck },
        { label: "อัตราสำเร็จ", value: `${successRate}%`, caption: "จากประวัติที่แจ้ง", icon: TrendingUp },
      ]}
      table={{ title: "เคสที่ได้รับมอบหมาย", description: "รายการเคสที่ลูกหนี้เลือกคุณเป็นผู้ไกล่เกลี่ย", columns: ["เลขเคส", "เจ้าหนี้", "ยอดหนี้", "สถานะ"], actionLabel: "ดูคิวงาน" }}
    >
      <section className="mt-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge>{mediatorStatusLabels[mediatorProfile.status]}</Badge>
            <h2 className="mt-3 text-xl font-semibold">{mediatorProfile.title ?? ""} {mediatorProfile.first_name} {mediatorProfile.last_name}</h2>
            <p className="mt-2 text-sm leading-6 text-[#6B7280]">{mediatorProfile.profile_summary || "ยังไม่มีสรุปโปรไฟล์"}</p>
          </div>
          <Button href="/mediator/profile" variant="outline" className="rounded-lg font-semibold">แก้ไขโปรไฟล์</Button>
        </div>
      </section>
    </PortalShell>
  );
}

async function getAssignedCases(mediatorProfileId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from("cases").select("*").eq("selected_mediator_profile_id", mediatorProfileId).order("updated_at", { ascending: false });
  return data ?? [];
}
