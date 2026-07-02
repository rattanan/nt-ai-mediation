import type { IconTextItem } from "@/data/landing";

export function FeatureCard({ item }: { item: IconTextItem }) {
  const Icon = item.icon;

  return (
    <div className="group rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
      <span className="flex size-12 items-center justify-center rounded-xl bg-primary/15 text-foreground transition-colors group-hover:bg-primary">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>
    </div>
  );
}
