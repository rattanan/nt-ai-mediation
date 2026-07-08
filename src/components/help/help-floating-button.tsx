"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/utils";

export function HelpFloatingButton() {
  const pathname = usePathname();

  if (pathname?.startsWith("/help")) {
    return null;
  }

  return (
    <Link
      href="/help"
      aria-label="เปิด Help Center"
      className={cn(
        "fixed bottom-5 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-[#E4C94A] bg-[#111827] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] focus-visible:ring-offset-2",
      )}
    >
      <CircleHelp className="size-4 text-[#F5B800]" aria-hidden="true" />
      <span>Help</span>
    </Link>
  );
}
