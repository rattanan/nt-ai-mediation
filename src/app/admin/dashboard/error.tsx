"use client";

import { ErrorState } from "@/components/admin/dashboard/dashboard-components";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4">
      <ErrorState message="โหลดข้อมูล Dashboard ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex h-10 items-center rounded-lg bg-[#111827] px-4 text-sm font-semibold text-white hover:bg-black"
      >
        โหลดใหม่
      </button>
    </div>
  );
}
