import type { IconTextItem } from "@/data/landing";

export function TimelineCard({
  item,
  index,
}: {
  item: IconTextItem;
  index: number;
}) {
  const Icon = item.icon;

  return (
    <li className="relative rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <span className="text-2xl font-bold text-muted-foreground/30">
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <h3 className="mt-4 text-base font-semibold">{item.title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {item.description}
      </p>
    </li>
  );
}
