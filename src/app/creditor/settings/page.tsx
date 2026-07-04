import { CreditorShell } from "@/components/creditor/creditor-shell";
import { Badge } from "@/components/ui/badge";
import { requireRole } from "@/lib/auth/server";
import { creditorOrganizationStatusLabels, getCreditorOfficer, getCreditorOrganization } from "@/lib/creditor";

export const dynamic = "force-dynamic";

export default async function CreditorSettingsPage() {
  const profile = await requireRole("creditor");
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);

  return (
    <CreditorShell profile={profile} activePath="/creditor/settings" title="ตั้งค่า" subtitle="ตรวจสอบข้อมูลบัญชี เจ้าหน้าที่ และองค์กรเจ้าหนี้">
      <section className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">บัญชีผู้ใช้</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[#6B7280]">ชื่อ</dt><dd className="font-medium">{profile.full_name}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#6B7280]">บทบาท</dt><dd className="font-medium">เจ้าหนี้</dd></div>
          </dl>
        </div>

        <div className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">ข้อมูลเจ้าหน้าที่</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4"><dt className="text-[#6B7280]">ชื่อ</dt><dd className="font-medium">{officer ? `${officer.first_name} ${officer.last_name}` : "-"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#6B7280]">ตำแหน่ง</dt><dd className="font-medium">{officer?.position ?? "-"}</dd></div>
            <div className="flex justify-between gap-4"><dt className="text-[#6B7280]">สถานะ</dt><dd className="font-medium">{officer?.status ?? "-"}</dd></div>
          </dl>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">องค์กรเจ้าหนี้</h2>
        {organization ? (
          <div className="mt-4 flex flex-col gap-5 md:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F8FAFC]">
              {organization.logo_url || organization.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={organization.logo_url ?? organization.logo ?? ""} alt="" className="h-full w-full object-contain p-3" />
              ) : <span className="text-sm font-semibold text-[#6B7280]">No Logo</span>}
            </div>
            <dl className="grid flex-1 gap-4 sm:grid-cols-2">
              <div><dt className="text-sm text-[#6B7280]">ชื่อองค์กร</dt><dd className="font-medium">{organization.organization_name}</dd></div>
              <div><dt className="text-sm text-[#6B7280]">สถานะ</dt><dd><Badge>{creditorOrganizationStatusLabels[organization.status]}</Badge></dd></div>
              <div><dt className="text-sm text-[#6B7280]">อีเมลติดต่อ</dt><dd className="font-medium">{organization.contact_email ?? "-"}</dd></div>
              <div><dt className="text-sm text-[#6B7280]">โทรศัพท์</dt><dd className="font-medium">{organization.contact_phone ?? "-"}</dd></div>
            </dl>
          </div>
        ) : <p className="mt-4 text-sm text-[#6B7280]">ยังไม่มีองค์กรเจ้าหนี้</p>}
      </section>
    </CreditorShell>
  );
}
