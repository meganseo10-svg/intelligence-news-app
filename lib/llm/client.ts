import Anthropic from "@anthropic-ai/sdk";
import { logApiUsage } from "@/lib/usage";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// 모델별 단가 (USD / 1M tokens)
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5-20251001": { input: 1, output: 5 },
};

export interface ClaudeCallParams {
  model: string;
  userPrompt: string;
  system?: string;
  maxTokens: number;
  temperature?: number;
  /** api_usage_log source 라벨 (예: "anthropic_analyze") */
  source?: string;
  userId?: string | null;
}

/** content 블록에서 text만 합쳐서 반환 */
function extractText(message: Anthropic.Message): string {
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Claude 호출 + 지수 백오프 재시도 + api_usage_log 자동 기록.
 * 성공 시 응답 텍스트, 모든 재시도 실패 시 null.
 */
export async function callClaudeWithRetry(
  params: ClaudeCallParams,
  maxRetries = 2,
): Promise<string | null> {
  const source = params.source ?? "anthropic";
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const message = await anthropic.messages.create({
        model: params.model,
        max_tokens: params.maxTokens,
        temperature: params.temperature ?? 0.3,
        ...(params.system ? { system: params.system } : {}),
        messages: [{ role: "user", content: params.userPrompt }],
      });

      const price = PRICING[params.model] ?? { input: 3, output: 15 };
      const costUsd =
        (message.usage.input_tokens * price.input +
          message.usage.output_tokens * price.output) /
        1_000_000;

      await logApiUsage({
        source,
        userId: params.userId ?? null,
        tokenInput: message.usage.input_tokens,
        tokenOutput: message.usage.output_tokens,
        costUsd,
        status: "ok",
      });

      return extractText(message);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[anthropic] 시도 ${attempt + 1} 실패:`, msg);
      if (attempt === maxRetries) {
        await logApiUsage({
          source,
          userId: params.userId ?? null,
          status: "error",
          errorMessage: msg,
        });
        return null;
      }
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt)); // 1s, 2s
    }
  }
  return null;
}
