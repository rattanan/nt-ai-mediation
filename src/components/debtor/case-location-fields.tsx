"use client";

import { useMemo, useState } from "react";
import { getDistrictsForProvince, thaiLocations } from "@/lib/thai-locations";

export function CaseLocationFields({
  province,
  district,
}: {
  province?: string | null;
  district?: string | null;
}) {
  const [selectedProvince, setSelectedProvince] = useState(province ?? "");
  const districts = useMemo(() => getDistrictsForProvince(selectedProvince), [selectedProvince]);
  const districtValue = districts.includes(district ?? "") ? district ?? "" : "";

  return (
    <>
      <label className="block">
        <span className="text-sm font-medium">จังหวัด</span>
        <select
          name="province"
          value={selectedProvince}
          onChange={(event) => setSelectedProvince(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm"
          required
        >
          <option value="">เลือกจังหวัด</option>
          {thaiLocations.map((item) => (
            <option key={item.province} value={item.province}>
              {item.province}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium">อำเภอ/เขต</span>
        <select
          key={selectedProvince}
          name="district"
          defaultValue={districtValue}
          disabled={!selectedProvince}
          className="mt-2 h-11 w-full rounded-lg border border-[#D1D5DB] bg-white px-3 text-sm disabled:bg-[#F3F4F6]"
          required
        >
          <option value="">{selectedProvince ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"}</option>
          {districts.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
