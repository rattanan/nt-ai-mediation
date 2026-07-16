import { MessageSquareText } from "lucide-react";
import { DebtorShell } from "@/components/debtor/debtor-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, getPage, paginateItems } from "@/components/ui/pagination";
import { requireRole } from "@/lib/auth/server";
import { MAX_AI_INTERVIEW_QUESTIONS } from "@/lib/ai/interview";
import { caseStatusLabels } from "@/lib/cases";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const aiStatusLabels = {
  pending: "รอเริ่มสัมภาษณ์",
  processing: "AI กำลังประมวลผล",
  interview: "รอตอบคำถาม",
  failed: "ต้องลองประมวลผลใหม่",
} as const;

export default async function DebtorInterviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const profile = await requireRole("debtor");
  const { page: pageParam } = await searchParams;
  const supabase = await createClient();
  const { data: cases } = await supabase
    .from("cases")
    .select("*")
    .eq("debtor_user_id", profile.id)
    .in("status", ["draft", "needs_more_info"])
    .order("updated_at", { ascending: false });
  const caseItems = cases ?? [];
  const caseIds = caseItems.map((item) => item.id);
  const { data: sessions } = caseIds.length > 0
    ? await supabase
        .from("case_ai_sessions")
        .select("case_id, status, question_count, updated_at")
        .in("case_id", caseIds)
    : { data: [] };
  const sessionByCaseId = new Map((sessions ?? []).map((session) => [session.case_id, session]));
  const pendingCases = caseItems.filter((item) => {
    const status = sessionByCaseId.get(item.id)?.status;
    return !status || ["pending", "processing", "interview", "failed"].includes(status);
  });
  const pageSize = 8;
  const { page, pageItems, total } = paginateItems(pendingCases, getPage(pageParam), pageSize);

  return (
    <DebtorShell
      profile={profile}
      activePath="/debtor/interviews"
      title="สัมภาษณ์ AI"
      subtitle="รายการคำขอที่ยังต้องสัมภาษณ์หรือให้ AI ประมวลผลข้อมูลเพิ่มเติม"
    >
      <section className="rounded-lg border border-black/5 bg-white shadow-sm">
        <div className="flex items-start gap-3 border-b border-black/5 px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#FFF2A8]">
            <MessageSquareText className="size-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">คำขอที่รอสัมภาษณ์ AI</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              ตอบคำถามให้ครบเพื่อให้ AI ช่วยสรุปข้อมูลและเตรียมเคสก่อนส่งคำขอ
            </p>
          </div>
        </div>

        <div className="divide-y divide-black/5">
          {pageItems.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="font-semibold">ไม่มีคำขอที่รอสัมภาษณ์ AI</p>
              <p className="mt-2 text-sm text-[#6B7280]">คำขอที่สัมภาษณ์ครบแล้วจะไม่แสดงในรายการนี้</p>
            </div>
          ) : (
            pageItems.map((item) => {
              const session = sessionByCaseId.get(item.id);
              const aiStatus = session?.status ?? "pending";

              return (
                <article key={item.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{item.case_number}</h3>
                      <Badge>{caseStatusLabels[item.status]}</Badge>
                      <Badge className={aiStatus === "failed" ? "border-red-200 bg-red-50 text-red-700" : undefined}>
                        {aiStatusLabels[aiStatus as keyof typeof aiStatusLabels]}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[#374151]">{item.creditor_name}</p>
                    <p className="mt-1 text-xs text-[#6B7280]">
                      ยอดหนี้ {Number(item.debt_amount).toLocaleString("th-TH")} บาท
                      {session ? ` · ตอบแล้ว ${Math.min(session.question_count, MAX_AI_INTERVIEW_QUESTIONS)}/${MAX_AI_INTERVIEW_QUESTIONS} คำถาม` : ""}
                    </p>
                  </div>
                  <Button href={`/debtor/cases/${item.id}/ai`} className="sm:min-w-36">
                    {aiStatus === "interview" ? "ตอบคำถามต่อ" : aiStatus === "failed" ? "ลองอีกครั้ง" : "เริ่มสัมภาษณ์"}
                  </Button>
                </article>
              );
            })
          )}
        </div>

        <Pagination basePath="/debtor/interviews" params={{}} page={page} pageSize={pageSize} total={total} />
      </section>
    </DebtorShell>
  );
}
