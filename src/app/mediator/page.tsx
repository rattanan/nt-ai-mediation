import { CalendarCheck2, ClipboardCheck, Gavel, TrendingUp, UserCheck } from "lucide-react";
import { requireRole } from "@/lib/auth/server";
import { PortalShell } from "@/components/portal-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getAppointmentsForMediator, isUpcomingAppointment } from "@/lib/appointments";
import { getMediatorAvailability, getMediatorProfileByUser, mediatorStatusLabels } from "@/lib/mediators";
import { getApprovedMediatorFeedback, getAssignedMediatorCases, mediatorSidebar } from "@/lib/mediator-portal";
import { getMediatorTrustScore, trustBadgeLabels } from "@/lib/trust-score";

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
  const assignedCases = mediatorProfile ? await getAssignedMediatorCases(mediatorProfile.id) : [];
  const appointments = mediatorProfile ? await getAppointmentsForMediator(mediatorProfile.id) : [];
  const trustScore = mediatorProfile ? await getMediatorTrustScore(mediatorProfile.id) : null;
  const feedback = mediatorProfile ? await getApprovedMediatorFeedback(mediatorProfile.id) : [];

  if (!mediatorProfile || mediatorProfile.status !== "approved") {
    return (
      <PortalShell
        roleLabel="Mediator Portal"
        title="ตั้งค่าโปรไฟล์ผู้ไกล่เกลี่ย"
        subtitle="กรอกข้อมูลประวัติ คุณสมบัติ และพื้นที่ให้บริการเพื่อส่งให้ผู้ดูแลระบบตรวจสอบ"
        userName={authProfile.full_name}
        sidebarItems={mediatorSidebar("/mediator/profile")}
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
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const todayAppointments = appointments.filter((appointment) => appointment.appointment_date === today && isUpcomingAppointment(appointment));
  const upcomingAppointments = appointments.filter(isUpcomingAppointment).slice(0, 4);
  const pendingAppointments = appointments.filter((appointment) => appointment.status === "pending_confirmation" && !appointment.confirmed_by_mediator_at);

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="แดชบอร์ดผู้ไกล่เกลี่ย"
      subtitle="จัดการเคสที่ได้รับมอบหมายและเวลาว่างของคุณ"
      userName={authProfile.full_name}
      sidebarItems={mediatorSidebar("/mediator")}
      metrics={[
        { label: "เคสที่ได้รับมอบหมาย", value: String(assignedCases.length), caption: "เคสที่เลือกคุณเป็นผู้ไกล่เกลี่ย", icon: Gavel },
        { label: "นัดวันนี้", value: String(todayAppointments.length), caption: "นัดไกล่เกลี่ยวันนี้", icon: CalendarCheck2 },
        { label: "รอยืนยัน", value: String(pendingAppointments.length), caption: "นัดหมายที่รอคุณยืนยัน", icon: ClipboardCheck },
        { label: "อัตราสำเร็จ", value: `${successRate}%`, caption: "จากประวัติที่แจ้ง", icon: TrendingUp },
        { label: "NT Trust Score", value: String(trustScore?.overall_score ?? 0), caption: trustScore ? trustBadgeLabels[trustScore.badge_code].th : "รอคำนวณคะแนน", icon: TrendingUp },
        { label: "Rating เฉลี่ย", value: (trustScore?.average_rating ?? 0).toFixed(1), caption: `${trustScore?.review_count ?? 0} รีวิวที่อนุมัติ`, icon: ClipboardCheck },
      ]}
      table={{ title: "", description: "", columns: [], actionLabel: "" }}
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}

      <section className="mt-6 grid gap-5 xl:grid-cols-[1fr_22rem]">
        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Feedback ล่าสุดจากลูกหนี้</h2>
          <div className="mt-4 space-y-3">
            {feedback.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มี feedback ที่อนุมัติ</p> : feedback.map((item) => (
              <div key={item.id} className="rounded-lg bg-[#F8FAFC] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">{item.rating} / 5</p>
                  <span className="text-xs text-[#6B7280]">{new Date(item.submitted_at).toLocaleDateString("th-TH")}</span>
                </div>
                {item.comment ? <p className="mt-2 text-sm text-[#374151]">{item.comment}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <aside className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <Badge>{mediatorStatusLabels[mediatorProfile.status]}</Badge>
          <h2 className="mt-3 text-lg font-semibold">สถานะการให้บริการ</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">เวลาว่าง</span>
              <span className="font-semibold">{availability?.active ? "เปิดรับนัดหมาย" : "ปิดรับนัดหมาย"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">นัดกำลังจะถึง</span>
              <span className="font-semibold">{upcomingAppointments.length} รายการ</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#6B7280]">รีวิวที่อนุมัติ</span>
              <span className="font-semibold">{trustScore?.review_count ?? 0} รีวิว</span>
            </div>
          </div>
          <div className="mt-5 grid gap-2">
            <Button href="/mediator/appointments" className="rounded-lg font-semibold">ไปที่นัดหมาย</Button>
            <Button href="/mediator/availability" variant="outline" className="rounded-lg font-semibold">จัดการเวลาว่าง</Button>
          </div>
        </aside>
      </section>
    </PortalShell>
  );
}
