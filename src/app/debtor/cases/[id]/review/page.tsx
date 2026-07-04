import { submitMediatorReview } from "@/app/debtor/cases/[id]/review/actions";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/server";
import { getCaseForDebtor } from "@/lib/cases";
import { getClosingForCase } from "@/lib/closing";
import { getMediatorReviewForCase } from "@/lib/mediator-reviews";

export const dynamic = "force-dynamic";

const reviewStatusLabels = {
  pending: "รอผู้ดูแลอนุมัติ",
  approved: "อนุมัติแล้ว",
  rejected: "ไม่อนุมัติ",
};

export default async function RateMediatorPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("debtor");
  const { id } = await params;
  const item = await getCaseForDebtor(id, profile.id);
  const closing = await getClosingForCase(id);
  const review = await getMediatorReviewForCase(id);
  const canReview = (item.status === "settled" || item.status === "closed") && Boolean(closing?.mediator_id ?? item.selected_mediator_profile_id);
  const action = submitMediatorReview.bind(null, item.id);

  return (
    <DebtorShell
      profile={profile}
      activePath="/debtor"
      title="ให้คะแนนผู้ไกล่เกลี่ย"
      subtitle={`เคส ${item.case_number}`}
    >
      <section className="mx-auto max-w-2xl rounded-lg border border-black/5 bg-white p-5 shadow-sm">
        <div className="border-b border-black/5 pb-5">
          <p className="text-sm font-semibold uppercase text-[#A87900]">Mediator Review</p>
          <h2 className="mt-2 text-2xl font-semibold">Rate Mediator</h2>
          <p className="mt-1 text-sm text-[#6B7280]">รีวิวที่ได้รับอนุมัติเท่านั้นจะถูกนำไปคำนวณ NT Trust Score</p>
        </div>

        {!canReview ? (
          <Alert variant="destructive" className="mt-5">สามารถให้คะแนนได้หลังเคสไกล่เกลี่ยสำเร็จแล้วเท่านั้น</Alert>
        ) : review ? (
          <div className="mt-5 rounded-lg bg-[#F8FAFC] p-4">
            <p className="font-semibold">คุณส่งรีวิวสำหรับเคสนี้แล้ว</p>
            <p className="mt-1 text-sm text-[#6B7280]">สถานะ: {reviewStatusLabels[review.status]}</p>
            <p className="mt-3 text-sm">คะแนน {review.rating} / 5</p>
            {review.comment ? <p className="mt-2 whitespace-pre-line text-sm text-[#374151]">{review.comment}</p> : null}
          </div>
        ) : (
          <form action={action} className="mt-5 space-y-5">
            <fieldset>
              <legend className="text-sm font-semibold">คะแนนความพึงพอใจ</legend>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex cursor-pointer flex-col items-center rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3 text-sm font-semibold hover:border-[#F5B800] hover:bg-[#FFF8D9]">
                    <input required type="radio" name="rating" value={rating} className="mb-2" />
                    {rating}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block">
              <span className="text-sm font-semibold">ความคิดเห็นเพิ่มเติม</span>
              <textarea
                name="comment"
                rows={5}
                className="mt-2 w-full rounded-lg border border-[#D1D5DB] px-3 py-2 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFF2A8]"
                placeholder="เล่าประสบการณ์การไกล่เกลี่ย ความเป็นมืออาชีพ และสิ่งที่อยากแนะนำ"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" className="rounded-lg font-semibold">ส่งรีวิว</Button>
              <Button href={`/debtor/cases/${item.id}`} variant="outline" className="rounded-lg">กลับไปหน้าเคส</Button>
            </div>
          </form>
        )}
      </section>
    </DebtorShell>
  );
}
