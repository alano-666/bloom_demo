import type { ChatReplyResult, CoreTaskResult, ParsedRecordResult, ReportSynthesisResult, TaskDecompositionResult } from "../types.js";

const DEFAULT_BASE_URL = process.env.ZAI_BASE_URL ?? "https://open.bigmodel.cn/api/paas/v4";
const DEFAULT_MODEL = process.env.ZAI_MODEL ?? "glm-4.5-flash";

function stripCodeFences(input: string) {
  return input.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
}

async function requestJson<T>(prompt: string): Promise<T> {
  const apiKey = process.env.ZAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ZAI_API_KEY");
  }

  const response = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "你是一个严格输出 JSON 的成长型 AI 助手。不要输出 markdown，不要输出解释，只输出合法 JSON。" },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Zhipu API error ${response.status}: ${text}`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Zhipu API returned empty content");
  }

  return JSON.parse(stripCodeFences(content)) as T;
}

export const zhipuClient = {
  chatReply: (prompt: string) => requestJson<ChatReplyResult>(prompt),
  coreTask: (prompt: string) => requestJson<CoreTaskResult>(prompt),
  decomposeTask: (prompt: string) => requestJson<TaskDecompositionResult>(prompt),
  parseRecord: (prompt: string) => requestJson<ParsedRecordResult>(prompt),
  synthesizeReport: (prompt: string) => requestJson<ReportSynthesisResult>(prompt),
};
