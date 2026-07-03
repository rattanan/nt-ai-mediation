import { saveMediatorDraft, submitMediatorProfile } from "@/app/mediator/actions";
import { Alert } from "@/components/ui/alert";
import { MediatorProfileForm } from "@/components/mediator/mediator-profile-form";
import { requireRole } from "@/lib/auth/server";
import { getMediatorAvailability, getMediatorDocuments, getMediatorProfileByUser } from "@/lib/mediators";
import { PortalShell } from "@/components/portal-shell";
import { UserCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MediatorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const authProfile = await requireRole("mediator");
  const { success, error } = await searchParams;
  const mediatorProfile = await getMediatorProfileByUser(authProfile.id);
  const availability = await getMediatorAvailability(mediatorProfile?.id);
  const docs = mediatorProfile ? await getMediatorDocuments(mediatorProfile.id) : [];

  return (
    <PortalShell
      roleLabel="Mediator Portal"
      title="โปรไฟล์ผู้ไกล่เกลี่ย"
      subtitle="กรอกประวัติและคุณสมบัติตามแบบฟอร์มสำหรับการตรวจสอบ"
      userName={authProfile.full_name}
      sidebarItems={[{ label: "โปรไฟล์", icon: UserCheck, active: true }]}
      metrics={[]}
      table={{ title: "", description: "", columns: [], actionLabel: "" }}
    >
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      <MediatorProfileForm
        profile={mediatorProfile}
        availability={availability}
        documents={docs.map((doc) => doc.file_url)}
        saveAction={saveMediatorDraft}
        submitAction={submitMediatorProfile}
      />
    </PortalShell>
  );
}
