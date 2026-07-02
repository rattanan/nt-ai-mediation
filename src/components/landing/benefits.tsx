import { BenefitCard } from "@/components/landing/benefit-card";
import { SectionHeading } from "@/components/landing/section-heading";
import { benefitGroups } from "@/data/landing";

export function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Benefits"
          title="Built for every party at the table"
          description="A fairer, faster outcome for debtors, creditors, and the mediators who bring them together."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {benefitGroups.map((group) => (
            <BenefitCard key={group.audience} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}
