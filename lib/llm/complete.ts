import OpenAI from "openai";
import { logApiUsage } from "@/lib/usage";

/**
 * ⭐ LLM 교체 지점 (single swap point).
 * 현재는 OpenAI(gpt-4o-mini)로 JSON 분석을 수행한다.
 * Anthropic 크레딧이 생기면 이 함수 내부만 Claude(lib/llm/client.ts)로 바꾸면
 * analyze.ts / suggest-keywords.ts 는 수정 없이 그대로 동작한다.
 */

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

const MODEL = "gpt-4o-mini";
// gpt-4o-mini 단가 (USD / 1M tokens)
const PRICING = { input: 0.15, output: 0.6 };

export interface CompleteJSONParams {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
  source: string;
  userId?: string | null;
}

/** system+user 프롬프트로 JSON 응답을 받아 문자열로 반환. 실패 시 null. */
export async function completeJSON(
  params: CompleteJSONParams,
  maxRetries = 2,
): Promise<string | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await openai.chat.completions.create({
        model: MODEL,
        temperature: params.temperature ?? 0.3,
        max_tokens: params.maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
      });

      const usage = res.usage;
      if (usage) {
        await logApiUsage({
          source: params.source,
          userId: params.userId ?? null,
          tokenInput: usage.prompt_tokens,
          tokenOutput: usage.completion_tokens,
          costUsd:
            (usage.prompt_tokens * PRICING.input +
              usage.completion_tokens * PRICING.output) /
            1_000_000,
          status: "ok",
        });
      }

      return res.choices[0]?.message?.content ?? null;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`[llm] 시도 ${attempt + 1} 실패:`, msg);
      if (attempt === maxRetries) {
        await logApiUsage({
          source: params.source,
          userId: params.userId ?? null,
          status: "error",
          errorMessage: msg,
        });
        return null;
      }
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  return null;
}
