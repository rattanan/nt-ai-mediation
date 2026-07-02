import Image from "next/image";
import { ArrowRight, Play, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--primary)_22%,transparent),transparent)]"
      />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:py-28">
        <div className="flex flex-col items-start">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Sparkles className="size-3.5 text-accent-blue" aria-hidden="true" />
            AI-assisted resolution, PDPA-compliant
          </span>

          <h1 className="mt-6 text-pretty text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            AI-Powered Digital <span className="text-foreground">Mediation Platform</span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Resolve debt disputes faster with AI-assisted mediation. Connect debtors,
            creditors, and certified mediators to reach fair settlements - without going to court.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button href="/login" size="lg" className="rounded-full font-semibold">
              Start Mediation
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button href="/dashboard/mediator" size="lg" variant="outline" className="rounded-full font-semibold">
              Find a Mediator
            </Button>
            <Button size="lg" variant="ghost" className="rounded-full font-semibold">
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Play className="size-3 fill-current" aria-hidden="true" />
              </span>
              Watch Demo
            </Button>
          </div>

          <div className="mt-10 flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            Trusted by government agencies and enterprise creditors
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-primary/10 blur-2xl" />
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5">
            <Image
              src="/images/hero-mediation.png"
              alt="AI assistant mediating a conversation between a debtor and a certified mediator"
              width={1024}
              height={768}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border border-border bg-card/90 p-4 shadow-lg backdrop-blur-md sm:flex">
            <span className="flex size-10 items-center justify-center rounded-xl bg-success/10 text-success">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold">Settlement reached</p>
              <p className="text-xs text-muted-foreground">Signed digitally in 12 days</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
