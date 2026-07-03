import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/landing/section-heading";
import type { LandingContent } from "@/data/landing";

export function Testimonials({ content }: { content: LandingContent["testimonials"] }) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeading eyebrow={content.eyebrow} title={content.title} />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {content.items.map((testimonial) => (
            <figure
              key={testimonial.name}
              className="flex flex-col justify-between rounded-3xl border border-border bg-card p-8 shadow-sm"
            >
              <Quote className="size-8 text-primary" aria-hidden="true" />
              <blockquote className="mt-5 text-pretty text-base leading-relaxed text-foreground">
                {testimonial.quote}
              </blockquote>
              <figcaption className="mt-7 flex items-center gap-3 border-t border-border pt-6">
                <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-foreground">
                  {testimonial.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{testimonial.name}</span>
                  <span className="block text-xs text-muted-foreground">{testimonial.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
