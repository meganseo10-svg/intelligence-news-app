import { completeJSON } from "./complete";
import {
  buildKeywordSuggestPrompt,
  type KeywordSuggestProfile,
} from "./prompts";
import { KeywordSuggestionSchema, type KeywordSuggestion } from "./schema";

function parseJson(text: string): unknown {
  const clean = text.replace(/```json\n?|```\n?/g, "").trim();
  return JSON.parse(clean);
}

/** 사용자 프로필 기반 키워드 12개(4그룹×3) 추천. 실패 시 null. */
export async function suggestKeywords(
  profile: KeywordSuggestProfile,
  userId?: string | null,
): Promise<KeywordSuggestion | null> {
  const text = await completeJSON({
    system: "당신은 B2B 인텔리전스 분석가입니다. JSON으로만 답합니다.",
    user: buildKeywordSuggestPrompt(profile),
    maxTokens: 1000,
    temperature: 0.7,
    source: "llm_keyword_suggest",
    userId,
  });
  if (!text) return null;
  try {
    return KeywordSuggestionSchema.parse(parseJson(text));
  } catch (e) {
    console.error("키워드 추천 파싱 실패:", e);
    return null;
  }
}
