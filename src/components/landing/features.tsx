import { FeatureCard } from "@/components/landing/feature-card";
import { SectionHeading } from "@/components/landing/section-heading";
import { platformFeatures } from "@/data/landing";

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading
          eyebrow="Platform features"
          title="Everything you need to resolve disputes"
          description="A complete, AI-assisted workflow from first contact to a signed, enforceable settlement."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {platformFeatures.map((feature) => (
            <FeatureCard key={feature.title} item={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
