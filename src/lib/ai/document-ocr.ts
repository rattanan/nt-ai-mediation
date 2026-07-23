import "server-only";

export async function processDocumentOcr(content: Uint8Array, mimeType: string) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  const configuredModel = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const model = configuredModel.replace(/^models\//, "");
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  let response: Response;
  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              {
                text: [
                  "อ่านข้อความทั้งหมดที่ปรากฏในเอกสารนี้อย่างเที่ยงตรง",
                  "ส่งกลับเฉพาะข้อความที่อ่านได้ตามลำดับโดยไม่สรุป ไม่ตีความ และไม่เพิ่มข้อมูลที่ไม่มีในเอกสาร",
                  "คงตัวเลข วันที่ ชื่อบุคคล และข้อความภาษาไทยตามต้นฉบับให้มากที่สุด",
                ].join(" "),
              },
              { inlineData: { mimeType, data: Buffer.from(content).toString("base64") } },
            ],
          }],
          generationConfig: { temperature: 0, maxOutputTokens: 32768 },
        }),
        signal: controller.signal,
        cache: "no-store",
      },
    );
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const detail = (await response.text()).replace(/\s+/g, " ").trim().slice(0, 500);
    throw new Error(`Gemini OCR returned ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
  };
  const candidate = payload.candidates?.[0];
  const text = candidate?.content?.parts?.map((part) => part.text ?? "").join("\n").trim();
  if (!text) throw new Error(`Gemini OCR returned no text${candidate?.finishReason ? ` (${candidate.finishReason})` : ""}`);

  return {
    text,
    pageCount: null,
    confidence: null,
  };
}
