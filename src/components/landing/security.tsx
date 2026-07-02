import { SecurityCard } from "@/components/landing/security-card";
import { auditedTrustIcon, securityItems } from "@/data/landing";

export function Security() {
  const ShieldIcon = auditedTrustIcon;

  return (
    <section id="security" className="scroll-mt-20 bg-card/40 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="text-sm font-semibold text-accent-blue">
              Security &amp; compliance
            </span>
            <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Enterprise-grade trust, built in
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Security is at the core of every mediation. We meet the standards expected by
              government agencies and enterprise creditors.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
              <span className="flex size-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <ShieldIcon className="size-5" aria-hidden="true" />
              </span>
              <p className="text-sm font-medium">
                Independently audited &amp; PDPA-certified infrastructure
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {securityItems.map((item) => (
              <SecurityCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
