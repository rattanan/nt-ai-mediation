import type { HTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className, ...props }: HTMLAttributes<SVGSVGElement>) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden="true" {...props} />;
}
