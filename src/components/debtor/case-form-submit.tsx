"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function CaseFormSubmit({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="rounded-lg font-semibold" disabled={pending}>
      {pending ? "กำลังบันทึก..." : label}
    </Button>
  );
}
