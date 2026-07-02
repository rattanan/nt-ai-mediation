import { trustPartners } from "@/data/landing";

export function TrustBar() {
  return (
    <section className="border-y border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by leading agencies and financial institutions
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {trustPartners.map((name) => (
            <span key={name} className="text-base font-semibold tracking-tight text-muted-foreground/70">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
