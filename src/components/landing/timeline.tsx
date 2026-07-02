import { SectionHeading } from "@/components/landing/section-heading";
import { TimelineCard } from "@/components/landing/timeline-card";
import { mediationSteps } from "@/data/landing";

export function Timeline() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-card/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="How it works"
          title="From dispute to settlement in eight steps"
          description="A clear, guided journey that keeps everyone aligned at every stage."
        />
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {mediationSteps.map((step, index) => (
            <TimelineCard key={step.title} item={step} index={index} />
          ))}
        </ol>
      </div>
    </section>
  );
}
