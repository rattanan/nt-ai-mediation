"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function StartAiInterviewSubmit({ hasSession }: { hasSession: boolean }) {
  const { pending } = useFormStatus();
  const label = hasSession ? "ประมวลผลต่อ / ลองใหม่" : "เริ่มสัมภาษณ์กับ AI";

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? <Spinner /> : null}
      {pending ? "กำลังเตรียมคำถาม..." : label}
    </Button>
  );
}

export function InterviewAnswerSubmit() {
  const { pending, data } = useFormStatus();
  const isUnknownAnswer = data?.get("answer_unknown") === "true";

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending && !isUnknownAnswer ? <Spinner /> : null}
        {pending && !isUnknownAnswer ? "กำลังส่งคำตอบ..." : "ส่งคำตอบ"}
      </Button>
      <Button
        type="submit"
        name="answer_unknown"
        value="true"
        variant="outline"
        formNoValidate
        disabled={pending}
        aria-busy={pending}
      >
        {pending && isUnknownAnswer ? <Spinner /> : null}
        {pending && isUnknownAnswer ? "กำลังส่ง..." : "ไม่ทราบ"}
      </Button>
    </div>
  );
}
