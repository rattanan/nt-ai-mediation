"use client";

import { useMemo, useState } from "react";
import { Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PublicCreditorOrganization = {
  id: string;
  organization_name: string;
  short_name: string | null;
  logo_url: string | null;
  logo: string | null;
  website: string | null;
  organization_type: string;
  address: string | null;
  contact_email: string | null;
  contact_phone: string | null;
};

export function CreditorOrganizationPicker({ organizations }: { organizations: PublicCreditorOrganization[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return organizations;
    return organizations.filter((org) => {
      const haystack = [
        org.organization_name,
        org.short_name,
        org.organization_type,
        org.address,
        org.contact_email,
        org.contact_phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [organizations, query]);

  return (
    <section className="rounded-lg border border-black/5 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-black/5 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">เลือกองค์กรเจ้าหนี้</h2>
          <p className="mt-1 text-sm text-[#6B7280]">ค้นหาและเลือกองค์กรก่อนเริ่มสร้างใบคำขอ</p>
        </div>
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหาองค์กร, ประเภท, อีเมล หรือเบอร์โทร"
            className="h-11 w-full rounded-lg border border-[#D1D5DB] pl-9 pr-3 text-sm outline-none focus:border-[#F5B800] focus:ring-2 focus:ring-[#FFD200]/30"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#D1D5DB] bg-[#F8FAFC] p-8 text-center text-sm text-[#6B7280] md:col-span-2 xl:col-span-3">
            ไม่พบองค์กรเจ้าหนี้ที่ตรงกับคำค้น
          </div>
        ) : filtered.map((org) => (
          <article key={org.id} className="flex min-h-full flex-col rounded-lg border border-black/5 bg-[#FCFCFD] p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#F5B800]/30 bg-[#FFF8D9]">
                {org.logo_url || org.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logo_url ?? org.logo ?? ""} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <Building2 className="h-7 w-7 text-[#A87900]" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#6B7280]">{org.organization_type}</p>
                <h3 className="mt-1 truncate text-lg font-semibold text-[#111827]">{org.short_name || org.organization_name}</h3>
              </div>
            </div>
            <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#4B5563]">
              {org.address || "ยังไม่มีที่อยู่"}{org.contact_email ? ` · ${org.contact_email}` : ""}{org.contact_phone ? ` · ${org.contact_phone}` : ""}
            </p>
            <div className="mt-auto pt-5">
              <Button href={`/debtor/cases/new?orgId=${encodeURIComponent(org.id)}`} className="h-11 w-full rounded-lg font-semibold">
                เลือกองค์กรนี้
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
