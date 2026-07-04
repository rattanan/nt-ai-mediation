import { Badge } from "@/components/ui/badge";
import { trustBadgeLabels, type TrustScore } from "@/lib/trust-score";

const classes: Record<TrustScore["badge_code"], string> = {
  gold_elite: "border-[#D4AF37]/40 bg-[#FFF8D9] text-[#6B4F00]",
  platinum: "border-slate-300 bg-slate-50 text-slate-700",
  trusted: "border-emerald-200 bg-emerald-50 text-emerald-700",
  verified: "border-blue-200 bg-blue-50 text-blue-700",
  new_mediator: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function TrustScoreBadge({ score, compact = false }: { score?: TrustScore | null; compact?: boolean }) {
  const badgeCode = score?.badge_code ?? "new_mediator";
  return (
    <Badge className={classes[badgeCode]}>
      {compact ? `${score?.overall_score ?? 0}` : `${trustBadgeLabels[badgeCode].th} · ${score?.overall_score ?? 0}/100`}
    </Badge>
  );
}
