import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "default" | "success" | "destructive";

const variantClasses: Record<AlertVariant, string> = {
  default: "border-[#F5B800]/30 bg-[#FFF8D9] text-[#6B4F00]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  destructive: "border-red-200 bg-red-50 text-red-800",
};

type AlertProps = HTMLAttributes<HTMLDivElement> & {
  variant?: AlertVariant;
};

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn("rounded-lg border px-4 py-3 text-sm leading-6", variantClasses[variant], className)}
      {...props}
    />
  );
}
