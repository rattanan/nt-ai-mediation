import { benefitCheckIcon, type BenefitGroup } from "@/data/landing";
import { cn } from "@/lib/utils";

export function BenefitCard({ group }: { group: BenefitGroup }) {
  const Icon = group.icon;
  const CheckIcon = benefitCheckIcon;

  return (
    <div
      className={cn(
        "rounded-3xl border bg-card p-8",
        group.highlighted
          ? "border-primary/40 shadow-lg ring-1 ring-primary/20"
          : "border-border shadow-sm",
      )}
    >
      <span
        className={cn(
          "flex size-12 items-center justify-center rounded-xl",
          group.highlighted
            ? "bg-primary text-primary-foreground"
            : "bg-primary/15 text-foreground",
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <h3 className="mt-5 text-xl font-semibold">{group.audience}</h3>
      <ul className="mt-6 space-y-3.5">
        {group.points.map((point) => (
          <li key={point} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckIcon className="size-3.5" aria-hidden="true" />
            </span>
            <span className="text-sm text-foreground">{point}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
