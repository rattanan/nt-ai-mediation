import { SectionHeading } from "@/components/landing/section-heading";
import { TimelineCard } from "@/components/landing/timeline-card";
import type { LandingContent } from "@/data/landing";

export function Timeline({ content }: { content: LandingContent["timeline"] }) {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-card/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow={content.eyebrow}
          title={content.title}
          description={content.description}
        />
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {content.items.map((step, index) => (
            <TimelineCard key={step.title} item={step} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}
