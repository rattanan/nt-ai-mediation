import { registerCreditorOrganization, updateCreditorOrganizationLogo } from "@/app/creditor/actions";
import { CreditorShell } from "@/components/creditor/creditor-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireRole } from "@/lib/auth/server";
import { creditorOrganizationStatusLabels, getCreditorOfficer, getCreditorOrganization } from "@/lib/creditor";

export const dynamic = "force-dynamic";

export default async function CreditorOrganizationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const profile = await requireRole("creditor");
  const { error, success } = await searchParams;
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);

  return (
    <CreditorShell profile={profile} activePath="/creditor/organization" title="องค์กรเจ้าหนี้" subtitle="ลงทะเบียนและติดตามสถานะองค์กรของคุณ">
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {organization ? (
        <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
          <section className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E5E7EB] bg-[#F8FAFC]">
                {organization.logo_url || organization.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={organization.logo_url ?? organization.logo ?? ""} alt="" className="h-full w-full object-contain p-3" />
                ) : <span className="text-sm font-semibold text-[#6B7280]">No Logo</span>}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-semibold">{organization.organization_name}</h2>
                <p className="mt-2 text-sm text-[#6B7280]">สถานะ: {creditorOrganizationStatusLabels[organization.status]}</p>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div><dt className="text-sm text-[#6B7280]">ประเภท</dt><dd className="font-medium">{organization.organization_type}</dd></div>
                  <div><dt className="text-sm text-[#6B7280]">เลขผู้เสียภาษี</dt><dd className="font-medium">{organization.tax_id ?? "-"}</dd></div>
                  <div><dt className="text-sm text-[#6B7280]">อีเมลติดต่อ</dt><dd className="font-medium">{organization.contact_email ?? "-"}</dd></div>
                  <div><dt className="text-sm text-[#6B7280]">โทรศัพท์</dt><dd className="font-medium">{organization.contact_phone ?? "-"}</dd></div>
                </dl>
              </div>
            </div>
          </section>
          <form action={updateCreditorOrganizationLogo} className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">อัปโหลดโลโก้</h2>
            <p className="mt-1 text-sm text-[#6B7280]">รองรับไฟล์รูปภาพ ขนาดไม่เกิน 2MB</p>
            <input name="logo_file" type="file" accept="image/*" required className="mt-5 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" />
            <Button type="submit" className="mt-4 w-full rounded-lg font-semibold">บันทึกโลโก้</Button>
          </form>
        </div>
      ) : (
        <form action={registerCreditorOrganization} className="space-y-5 rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">ลงทะเบียนองค์กรเจ้าหนี้</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label><span className="text-sm font-medium">ชื่อองค์กร</span><Input name="organization_name" className="mt-2" required /></label>
            <label><span className="text-sm font-medium">ประเภทองค์กร</span><Input name="organization_type" className="mt-2" placeholder="เช่น ธนาคาร / ลีสซิ่ง" required /></label>
            <label><span className="text-sm font-medium">เลขผู้เสียภาษี</span><Input name="tax_id" className="mt-2" /></label>
            <label><span className="text-sm font-medium">อีเมลติดต่อ</span><Input name="contact_email" type="email" className="mt-2" /></label>
            <label><span className="text-sm font-medium">โทรศัพท์</span><Input name="contact_phone" className="mt-2" /></label>
            <label><span className="text-sm font-medium">ที่อยู่</span><Input name="address" className="mt-2" /></label>
            <label><span className="text-sm font-medium">โลโก้องค์กร</span><input name="logo_file" type="file" accept="image/*" className="mt-2 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" /></label>
          </div>
          <Button type="submit" className="rounded-lg font-semibold">ส่งคำขออนุมัติองค์กร</Button>
        </form>
      )}
    </CreditorShell>
  );
}
