import { createCase } from "@/app/debtor/cases/actions";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { CaseForm } from "@/components/debtor/case-form";
import { Alert } from "@/components/ui/alert";
import { requireRole } from "@/lib/auth/server";
import { listPublicCreditorOrganizations } from "@/lib/creditor";
import { CreditorOrganizationPicker } from "@/components/debtor/creditor-organization-picker";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewCasePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; orgId?: string }>;
}) {
  const profile = await requireRole("debtor");
  const { error, orgId } = await searchParams;
  const organizations = await listPublicCreditorOrganizations();
  const selected = orgId ? organizations.find((organization) => organization.id === orgId) ?? null : null;
  const preferredMediatorId = (await cookies()).get("nt_preferred_mediator")?.value ?? "";
  const supabase = await createClient();
  const { data: preferredMediator } = preferredMediatorId ? await supabase.from("mediator_profiles")
    .select("id, title, first_name, last_name, profile_photo_url, expertise_areas")
    .eq("id", preferredMediatorId).eq("status", "approved").maybeSingle() : { data: null };

  return (
    <DebtorShell
      profile={profile}
      activePath="/debtor/cases"
      title="สร้างใบคำขอ"
      subtitle={selected ? "กรอกข้อมูลหนี้ ปัญหา และแนวทางที่ต้องการเพื่อเริ่มกระบวนการ" : "ค้นหาและเลือกองค์กรเจ้าหนี้ก่อนเริ่มสร้างใบคำขอ"}
    >
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      {preferredMediator ? (
        <section className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-[#F5B800]/40 bg-[#FFF8D9] p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white font-bold text-[#8A6500]">
              {preferredMediator.profile_photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preferredMediator.profile_photo_url} alt="" className="h-full w-full object-cover" />
              ) : preferredMediator.first_name.slice(0, 1)}
            </div>
            <div><p className="text-xs font-semibold text-[#8A6500]">ผู้ไกล่เกลี่ยที่คุณเลือกไว้</p><h2 className="mt-1 font-semibold">{preferredMediator.title} {preferredMediator.first_name} {preferredMediator.last_name}</h2><p className="mt-1 text-sm text-[#6B7280]">ระบบจะจดจำและส่งคำเชิญหลังเจ้าหนี้ยอมรับคำขอ</p></div>
          </div>
          <a href="/mediators" className="shrink-0 text-sm font-semibold text-[#8A6500]">เปลี่ยนคน</a>
        </section>
      ) : null}
      {selected ? (
        <>
          <section className="mb-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#F5B800]/30 bg-[#FFF8D9]">
                {selected.logo_url || selected.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.logo_url ?? selected.logo ?? ""} alt="" className="h-full w-full object-contain p-2" />
                ) : null}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#6B7280]">{selected.organization_type}</p>
                <h2 className="text-xl font-semibold">{selected.short_name || selected.organization_name}</h2>
                <p className="mt-1 text-sm text-[#6B7280]">{selected.address || "ยังไม่มีที่อยู่"}</p>
              </div>
            </div>
          </section>
          <CaseForm
            action={createCase}
            submitLabel="บันทึกแบบร่าง"
            campaignSummary={{
              organizationId: selected.id,
              campaignId: "",
              organizationName: selected.organization_name,
              campaignTitle: "ใบคำขอไกล่เกลี่ย",
              debtType: "",
            }}
          />
        </>
      ) : (
        <CreditorOrganizationPicker organizations={organizations} />
      )}
    </DebtorShell>
  );
}
