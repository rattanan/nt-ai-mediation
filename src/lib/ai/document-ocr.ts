import "server-only";

import { getGoogleAccessToken } from "@/lib/google/auth";

export async function processDocumentOcr(content: Uint8Array, mimeType: string) {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_DOCUMENT_AI_LOCATION || "asia-southeast1";
  const processor = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR;
  if (!project || !processor) throw new Error("Google Document AI is not configured");

  const token = await getGoogleAccessToken(["https://www.googleapis.com/auth/cloud-platform"]);
  const endpoint = `${location}-documentai.googleapis.com`;
  const response = await fetch(
    `https://${endpoint}/v1/projects/${project}/locations/${location}/processors/${processor}:process`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ rawDocument: { content: Buffer.from(content).toString("base64"), mimeType } }),
      cache: "no-store",
    },
  );
  if (!response.ok) throw new Error(`Document AI returned ${response.status}`);
  const payload = await response.json() as {
    document?: { text?: string; pages?: Array<{ layout?: { confidence?: number } }> };
  };
  const text = payload.document?.text?.trim();
  if (!text) throw new Error("Document AI returned no text");
  const confidences = payload.document?.pages?.map((page) => page.layout?.confidence).filter((value): value is number => typeof value === "number") ?? [];
  return {
    text,
    pageCount: payload.document?.pages?.length || null,
    confidence: confidences.length ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length : null,
  };
}

