import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#F5B800]/30 bg-[#FFF8D9] px-3 py-1 text-xs font-semibold text-[#6B4F00]",
        className,
      )}
      {...props}
    />
  );
}
