import { PublicMediatorCard } from "@/components/mediator/public-mediator-card";
import { getTopTrustedMediators } from "@/lib/trust-score";

export async function TopTrustedMediators() {
  const mediators = await getTopTrustedMediators(6);
  if (mediators.length === 0) return null;

  return (
    <section className="bg-[#F8FAFC] px-5 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase text-[#A87900]">NT Trust Score</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#111827]">Top Trusted Mediators</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6B7280]">จัดอันดับจากคะแนนความน่าเชื่อถือหลายมิติ ไม่ได้พึ่งรีวิวเพียงอย่างเดียว</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mediators.map((mediator) => <PublicMediatorCard key={mediator.id} mediator={mediator} />)}
        </div>
      </div>
    </section>
  );
}
