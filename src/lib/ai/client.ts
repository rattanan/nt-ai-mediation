import "server-only";

type ChatRole = "system" | "user" | "assistant";

export type AiChatMessage = { role: ChatRole; content: string };

function getConfig() {
  const apiUrl = process.env.OPENAI_API_URL?.replace(/\/$/, "");
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "openai/gpt-oss-120b";

  if (!apiUrl || !apiKey) throw new Error("AI endpoint is not configured");
  if (apiUrl.startsWith("http://") && process.env.ALLOW_INSECURE_AI_HTTP !== "true") {
    throw new Error("Insecure AI HTTP endpoint is disabled");
  }
  return { apiUrl, apiKey, model };
}

function parseJsonObject(value: string): Record<string, unknown> {
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const parsed: unknown = JSON.parse(cleaned);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("AI response is not a JSON object");
  return parsed as Record<string, unknown>;
}

export async function requestStructuredAi(messages: AiChatMessage[]) {
  const { apiUrl, apiKey, model } = getConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.15,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`AI endpoint returned ${response.status}`);
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI endpoint returned no content");
    return { data: parseJsonObject(content), model };
  } finally {
    clearTimeout(timeout);
  }
}

export function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map(String).map((item) => item.trim()).filter(Boolean) : [];
}

