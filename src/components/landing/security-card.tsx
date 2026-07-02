import type { IconTextItem } from "@/data/landing";

export function SecurityCard({ item }: { item: IconTextItem }) {
  const Icon = item.icon;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-foreground">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>
    </div>
  );
}
