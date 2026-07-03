import { registerCreditorOrganization } from "@/app/creditor/actions";
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
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await requireRole("creditor");
  const { error } = await searchParams;
  const officer = await getCreditorOfficer(profile.id);
  const organization = await getCreditorOrganization(officer?.organization_id);

  return (
    <CreditorShell profile={profile} activePath="/creditor/organization" title="องค์กรเจ้าหนี้" subtitle="ลงทะเบียนและติดตามสถานะองค์กรของคุณ">
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      {organization ? (
        <section className="rounded-lg border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">{organization.organization_name}</h2>
          <p className="mt-2 text-sm text-[#6B7280]">สถานะ: {creditorOrganizationStatusLabels[organization.status]}</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-[#6B7280]">ประเภท</dt><dd className="font-medium">{organization.organization_type}</dd></div>
            <div><dt className="text-sm text-[#6B7280]">เลขผู้เสียภาษี</dt><dd className="font-medium">{organization.tax_id ?? "-"}</dd></div>
            <div><dt className="text-sm text-[#6B7280]">อีเมลติดต่อ</dt><dd className="font-medium">{organization.contact_email ?? "-"}</dd></div>
            <div><dt className="text-sm text-[#6B7280]">โทรศัพท์</dt><dd className="font-medium">{organization.contact_phone ?? "-"}</dd></div>
          </dl>
        </section>
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
          </div>
          <Button type="submit" className="rounded-lg font-semibold">ส่งคำขออนุมัติองค์กร</Button>
        </form>
      )}
    </CreditorShell>
  );
}
