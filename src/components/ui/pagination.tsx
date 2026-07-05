import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type SearchValue = string | number | null | undefined;

function pageHref(basePath: string, params: Record<string, SearchValue>, pageParam: string, page: number) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (key === pageParam || value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });

  if (page > 1) search.set(pageParam, String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export function Pagination({
  basePath,
  params,
  page,
  pageSize,
  total,
  pageParam = "page",
}: {
  basePath: string;
  params: Record<string, SearchValue>;
  page: number;
  pageSize: number;
  total: number;
  pageParam?: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex flex-col gap-3 border-t border-black/5 px-5 py-4 text-sm text-[#6B7280] sm:flex-row sm:items-center sm:justify-between">
      <p>
        แสดง {from.toLocaleString("th-TH")}-{to.toLocaleString("th-TH")} จาก {total.toLocaleString("th-TH")} รายการ
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={pageHref(basePath, params, pageParam, Math.max(1, currentPage - 1))}
          aria-disabled={currentPage === 1}
          className={`inline-flex h-9 items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 font-semibold ${
            currentPage === 1 ? "pointer-events-none opacity-50" : "hover:bg-[#FFF7D1]"
          }`}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          ก่อนหน้า
        </Link>
        <span className="rounded-lg bg-[#F3F4F6] px-3 py-2 font-semibold text-[#111827]">
          {currentPage.toLocaleString("th-TH")} / {totalPages.toLocaleString("th-TH")}
        </span>
        <Link
          href={pageHref(basePath, params, pageParam, Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage === totalPages}
          className={`inline-flex h-9 items-center gap-1 rounded-lg border border-[#E5E7EB] px-3 font-semibold ${
            currentPage === totalPages ? "pointer-events-none opacity-50" : "hover:bg-[#FFF7D1]"
          }`}
        >
          ถัดไป
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function getPage(value?: string, fallback = 1) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : fallback;
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const currentPage = Math.min(Math.max(page, 1), Math.max(1, Math.ceil(items.length / pageSize)));
  const start = (currentPage - 1) * pageSize;
  return {
    page: currentPage,
    pageItems: items.slice(start, start + pageSize),
    total: items.length,
  };
}
