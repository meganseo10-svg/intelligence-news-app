import { completeJSON } from "./complete";
import {
  buildAnalysisPrompt,
  SYSTEM_PROMPT,
  type AnalysisInput,
} from "./prompts";
import { NewsAnalysisSchema, type NewsAnalysis } from "./schema";

function parseJson(text: string): unknown {
  const clean = text.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(clean);
}

/** 뉴스 1건 분석 (번역+요약+분류+점수+시사점). 실패 시 throw. */
export async function analyzeNews(
  input: AnalysisInput,
  userId?: string | null,
): Promise<NewsAnalysis> {
  const text = await completeJSON({
    system: SYSTEM_PROMPT,
    user: buildAnalysisPrompt(input),
    maxTokens: 1500,
    temperature: 0.3,
    source: "llm_analyze",
    userId,
  });
  if (!text) throw new Error("LLM 분석 응답이 비었습니다.");
  return NewsAnalysisSchema.parse(parseJson(text));
}

/** 재시도 포함 분석. 최종 실패 시 null. */
export async function analyzeNewsWithRetry(
  input: AnalysisInput,
  userId?: string | null,
  maxRetries = 2,
): Promise<NewsAnalysis | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await analyzeNews(input, userId);
    } catch (error) {
      console.error(`분석 시도 ${attempt + 1} 실패:`, error);
      if (attempt === maxRetries) return null;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
  return null;
}
