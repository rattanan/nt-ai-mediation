import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="pb-20 lg:pb-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-foreground px-8 py-16 text-center sm:px-16 sm:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(50%_80%_at_50%_0%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent)]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-balance text-3xl font-bold tracking-tight text-background sm:text-4xl">
              Start your digital mediation today
            </h2>
            <p className="mt-4 text-pretty text-lg text-background/70">
              Join thousands resolving debt disputes faster, fairer, and without the courtroom.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button href="/login" size="lg" className="rounded-full font-semibold">
                Start Mediation
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
              <Button
                href="/dashboard/mediator"
                size="lg"
                variant="outline"
                className="rounded-full border-background/30 bg-transparent font-semibold text-background hover:bg-background/10 hover:text-background"
              >
                Find a Mediator
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
