import type { ReactNode } from "react";
import { acceptCaseAssignment, rejectCaseAssignment } from "./assignment-actions";
import { requireRole } from "@/lib/auth/server";
import { getMediatorProfileByUser } from "@/lib/mediators";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MediatorCaseLayout({ children, params }: { children: ReactNode; params: Promise<{ caseId: string }> }) {
  const profile = await requireRole("mediator");
  const mediator = await getMediatorProfileByUser(profile.id);
  const { caseId } = await params;
  const supabase = await createClient();
  const { data: assignment } = mediator ? await supabase.from("cases").select("id, status")
    .eq("id", caseId).eq("selected_mediator_profile_id", mediator.id).eq("assigned_mediator_id", profile.id).maybeSingle() : { data: null };

  return (
    <>
      {assignment?.status === "mediator_selected" ? (
        <section className="mx-auto mb-5 max-w-7xl rounded-lg border border-amber-300 bg-amber-50 p-5 text-[#111827]">
          <h1 className="text-lg font-semibold">คำเชิญรับหน้าที่ผู้ไกล่เกลี่ย</h1>
          <p className="mt-1 text-sm text-amber-900">โปรดยืนยันว่าจะรับเคสนี้ คู่กรณีจะเลือกเวลานัดหมายได้หลังจากคุณตอบรับ</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <form action={acceptCaseAssignment}>
              <input type="hidden" name="case_id" value={caseId} />
              <button type="submit" className="h-11 w-full rounded-lg bg-[#FFD200] px-4 text-sm font-semibold">รับเคสและเปิดการนัดหมาย</button>
            </form>
            <form action={rejectCaseAssignment} className="flex gap-2">
              <input type="hidden" name="case_id" value={caseId} />
              <input name="reason" required placeholder="เหตุผลที่ไม่สามารถรับเคส" className="h-11 min-w-0 flex-1 rounded-lg border border-amber-300 bg-white px-3 text-sm" />
              <button type="submit" className="h-11 rounded-lg border border-amber-400 bg-white px-4 text-sm font-semibold">ปฏิเสธ</button>
            </form>
          </div>
        </section>
      ) : null}
      {assignment?.status === "appointment_scheduling" ? (
        <section className="mx-auto mb-5 max-w-7xl rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
          <h1 className="text-lg font-semibold">รับเคสแล้ว</h1>
          <p className="mt-1 text-sm">ขณะนี้กำลังรอลูกหนี้เลือกเวลานัดหมาย ระบบจะแสดงนัดหมายให้ยืนยันเมื่อมีการเสนอเวลา</p>
        </section>
      ) : null}
      {children}
    </>
  );
}
