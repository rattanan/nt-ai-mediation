import { BenefitCard } from "@/components/landing/benefit-card";
import { SectionHeading } from "@/components/landing/section-heading";
import type { LandingContent } from "@/data/landing";

export function Benefits({ content }: { content: LandingContent["benefits"] }) {
  return (
    <section id="benefits" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {content.groups.map((group) => (
            <BenefitCard key={group.audience} group={group} />
          ))}
        </div>
      </div>
    </section>
  );
}
