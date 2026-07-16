import { processNextMeetingJob, reconcileMeetingProcessing } from "@/lib/meetings/processing";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const expected = process.env.INTERNAL_JOB_SECRET;
  if (!expected || request.headers.get("authorization") !== `Bearer ${expected}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const [job, reconciliation] = await Promise.all([processNextMeetingJob(), reconcileMeetingProcessing()]);
  return Response.json({ job, reconciliation });
}
