"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function MediatorFormSubmit({
  label,
  variant,
  formAction,
}: {
  label: string;
  variant?: "default" | "outline";
  formAction: (formData: FormData) => void;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      formAction={formAction}
      disabled={pending}
      className={
        variant === "outline"
          ? "rounded-lg border-white/30 bg-transparent font-semibold text-white hover:bg-white/10 hover:text-white"
          : "rounded-lg font-semibold"
      }
    >
      {pending ? "กำลังบันทึก..." : label}
    </Button>
  );
}
