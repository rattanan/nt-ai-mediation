import Link from "next/link";
import { approveMediator, approveMediatorReview, recalculateAllTrustScores, rejectMediator, rejectMediatorReview, requestMediatorRevision, suspendMediator } from "@/app/admin/mediators/actions";
import { AdminShell } from "@/components/admin/admin-shell";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPage, paginateItems, Pagination } from "@/components/ui/pagination";
import { requireAdmin } from "@/lib/admin/auth";
import { listPendingMediatorReviews } from "@/lib/mediator-reviews";
import { getMediatorAvailability, getMediatorDocuments, getMediatorReviewLogs, getSubmittedMediatorProfiles, jsonList, mediatorStatusLabels } from "@/lib/mediators";

export const dynamic = "force-dynamic";

export default async function AdminMediatorReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ profileId?: string; page?: string; success?: string; error?: string }>;
}) {
  const admin = await requireAdmin();
  const { profileId, page: pageParam, success, error } = await searchParams;
  const profiles = await getSubmittedMediatorProfiles();
  const pageSize = 10;
  const { page, pageItems: pagedProfiles } = paginateItems(profiles, getPage(pageParam), pageSize);
  const selected = profiles.find((profile) => profile.id === profileId) ?? profiles[0] ?? null;
  const availability = selected ? await getMediatorAvailability(selected.id) : null;
  const docs = selected ? await getMediatorDocuments(selected.id) : [];
  const logs = selected ? await getMediatorReviewLogs(selected.id) : [];
  const pendingReviews = await listPendingMediatorReviews();
  const listParams = { profileId, ...(page > 1 ? { page: String(page) } : {}) };

  return (
    <AdminShell profile={admin} activePath="/admin/mediators" title="Mediator Review" subtitle="ตรวจสอบ อนุมัติ และจัดการโปรไฟล์ผู้ไกล่เกลี่ย">
      {success ? <Alert variant="success" className="mb-5">{success}</Alert> : null}
      {error ? <Alert variant="destructive" className="mb-5">{error}</Alert> : null}
      <form action={recalculateAllTrustScores} className="mb-5">
        <Button type="submit" variant="outline" className="rounded-lg font-semibold">คำนวณ NT Trust Score ใหม่ทั้งหมด</Button>
      </form>
      <section className="mb-6 rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-black/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">คิวอนุมัติรีวิวผู้ไกล่เกลี่ย</h2>
            <p className="mt-1 text-sm text-[#6B7280]">รีวิวที่อนุมัติแล้วเท่านั้นจะถูกนำไปคำนวณ NT Trust Score</p>
          </div>
          <Badge>{pendingReviews.length.toLocaleString("th-TH")} รายการ</Badge>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {pendingReviews.length === 0 ? (
            <p className="text-sm text-[#6B7280]">ไม่มีรีวิวรออนุมัติ</p>
          ) : pendingReviews.map((review) => (
            <article key={review.id} className="rounded-lg bg-[#F8FAFC] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-semibold">{review.mediator_profiles?.title ?? ""} {review.mediator_profiles?.first_name} {review.mediator_profiles?.last_name}</p>
                  <p className="mt-1 text-sm text-[#6B7280]">เคส {review.cases?.case_number ?? "-"} · {review.cases?.creditor_name ?? "-"}</p>
                </div>
                <Badge>{review.rating} / 5</Badge>
              </div>
              {review.comment ? <p className="mt-3 whitespace-pre-line rounded-lg bg-white p-3 text-sm text-[#374151]">{review.comment}</p> : null}
              <p className="mt-2 text-xs text-[#6B7280]">โดย {review.debtor_profile?.full_name ?? "ลูกหนี้"} · {new Date(review.submitted_at).toLocaleString("th-TH")}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <ReviewRatingButton action={approveMediatorReview} id={review.id} label="อนุมัติรีวิว" />
                <ReviewRatingButton action={rejectMediatorReview} id={review.id} label="ไม่อนุมัติ" variant="outline" />
              </div>
            </article>
          ))}
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <section className="rounded-lg border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 px-5 py-4">
            <h2 className="font-semibold">รายการโปรไฟล์</h2>
            <p className="mt-1 text-sm text-[#6B7280]">{profiles.length.toLocaleString("th-TH")} รายการ</p>
          </div>
          <div className="divide-y divide-black/5">
            {profiles.length === 0 ? <p className="px-5 py-10 text-center text-sm text-[#6B7280]">ยังไม่มีโปรไฟล์รอตรวจสอบ</p> : pagedProfiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/admin/mediators?${new URLSearchParams({
                  ...listParams,
                  profileId: profile.id,
                }).toString()}`}
                className={`block px-5 py-4 hover:bg-[#FFFBEA] ${selected?.id === profile.id ? "bg-[#FFF8D9]" : ""}`}
              >
                <p className="font-semibold">{profile.title ?? ""} {profile.first_name} {profile.last_name}</p>
                <p className="mt-1 text-sm text-[#6B7280]">{profile.province || "ไม่ระบุจังหวัด"} · {profile.mediation_experience_years} ปี</p>
                <Badge className="mt-2">{mediatorStatusLabels[profile.status]}</Badge>
              </Link>
            ))}
          </div>
          <Pagination basePath="/admin/mediators" params={listParams} page={page} pageSize={pageSize} total={profiles.length} />
        </section>

        {selected ? (
          <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-black/5 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Badge>{mediatorStatusLabels[selected.status]}</Badge>
                <h2 className="mt-3 text-2xl font-semibold">{selected.title ?? ""} {selected.first_name} {selected.last_name}</h2>
                <p className="mt-1 text-sm text-[#6B7280]">{selected.mediator_license_number || "ไม่มีเลขทะเบียน"} · {selected.mediator_registration_authority || "ไม่ระบุหน่วยงาน"}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <ReviewButton action={approveMediator} id={selected.id} label="อนุมัติ" />
                <ReviewButton action={requestMediatorRevision} id={selected.id} label="ขอแก้ไข" variant="outline" />
                <ReviewButton action={rejectMediator} id={selected.id} label="ปฏิเสธ" variant="outline" />
                <ReviewButton action={suspendMediator} id={selected.id} label="ระงับ" variant="outline" />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Info label="โทรศัพท์" value={selected.phone || "-"} />
              <Info label="อีเมล" value={selected.email || "-"} />
              <Info label="พื้นที่" value={`${selected.district || ""} ${selected.province || ""}`} />
              <Info label="ประสบการณ์" value={`${selected.mediation_experience_years} ปี`} />
              <Info label="เคสทั้งหมด" value={`${selected.total_cases_handled}`} />
              <Info label="เคสสำเร็จ" value={`${selected.successful_cases}`} />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <TextPanel title="ความเชี่ยวชาญ" value={jsonList(selected.expertise_areas).join(", ") || "-"} />
              <TextPanel title="ประเภทหนี้ที่รองรับ" value={jsonList(selected.debt_types_supported).join(", ") || "-"} />
              <TextPanel title="พื้นที่ให้บริการ" value={jsonList(selected.service_provinces).join(", ") || "-"} />
              <TextPanel title="เวลาว่าง" value={`${jsonList(availability?.available_days).join(", ") || "-"} / ${jsonList(availability?.available_time_slots).join(", ") || "-"}`} />
            </div>

            <form action={approveMediator} className="mt-6 rounded-lg bg-[#F8FAFC] p-4">
              <input type="hidden" name="profile_id" value={selected.id} />
              <label className="block">
                <span className="text-sm font-medium">Internal review note</span>
                <textarea name="note" className="mt-2 min-h-24 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm" defaultValue={selected.admin_review_note ?? ""} />
              </label>
              <Button type="submit" className="mt-3 rounded-lg font-semibold">บันทึก note และอนุมัติ</Button>
            </form>

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <Timeline title="เอกสาร" items={docs.map((doc) => `${doc.document_type}: ${doc.file_url}`)} />
              <Timeline title="ประวัติ review" items={logs.map((log) => `${mediatorStatusLabels[log.to_status]}${log.note ? ` - ${log.note}` : ""}`)} />
            </div>
          </section>
        ) : null}
      </div>
    </AdminShell>
  );
}

function ReviewButton({ action, id, label, variant = "default" }: { action: (formData: FormData) => Promise<void>; id: string; label: string; variant?: "default" | "outline" }) {
  return <form action={action}><input type="hidden" name="profile_id" value={id} /><Button type="submit" variant={variant} className="rounded-lg font-semibold">{label}</Button></form>;
}

function ReviewRatingButton({ action, id, label, variant = "default" }: { action: (formData: FormData) => Promise<void>; id: string; label: string; variant?: "default" | "outline" }) {
  return <form action={action}><input type="hidden" name="review_id" value={id} /><Button type="submit" variant={variant} className="w-full rounded-lg font-semibold">{label}</Button></form>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-[#F8FAFC] p-4"><p className="text-sm text-[#6B7280]">{label}</p><p className="mt-1 font-semibold">{value}</p></div>;
}

function TextPanel({ title, value }: { title: string; value: string }) {
  return <div><h3 className="font-semibold">{title}</h3><p className="mt-2 whitespace-pre-line rounded-lg bg-[#F8FAFC] p-4 text-sm leading-6 text-[#374151]">{value}</p></div>;
}

function Timeline({ title, items }: { title: string; items: string[] }) {
  return <div><h3 className="font-semibold">{title}</h3><div className="mt-3 space-y-2">{items.length === 0 ? <p className="text-sm text-[#6B7280]">ยังไม่มีข้อมูล</p> : items.map((item, index) => <p key={index} className="break-all rounded-lg bg-[#F8FAFC] p-3 text-sm">{item}</p>)}</div></div>;
}
