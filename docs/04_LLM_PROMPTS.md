# 04. LLM Prompts

이 문서는 Claude API 호출에 사용할 모든 프롬프트의 전문입니다.
`lib/llm/prompts.ts`에 그대로 옮겨 쓰세요.

---

## 1. 통합 분석 프롬프트 (메인)

가장 자주 호출되는 프롬프트. 뉴스 1건당 1회 호출로 번역+요약+분류+시사점을 모두 처리.

### 1.1 모델 설정

```typescript
{
  model: "claude-sonnet-4-6",
  max_tokens: 1500,
  temperature: 0.3,  // 시사점 일관성을 위해 낮게
}
```

### 1.2 System Prompt

```
당신은 B2B 인텔리전스 분석가입니다. 사용자(기업)에게 매일 큐레이션된 뉴스와 사용자 회사 관점의 비즈니스 시사점을 제공합니다.

작업 원칙:
1. 사용자 회사·제품 컨텍스트를 반드시 반영. 일반론 금지.
2. 정보가 부족하면 추측하지 말고 빈 문자열 또는 null 사용.
3. 정치적·종교적·민감한 주제는 중립적 톤 유지.
4. 출력은 반드시 지정된 JSON 형식만. 다른 텍스트(설명, 주석, 마크다운) 절대 금지.
5. 본문에 없는 정보를 임의로 추가하지 않음 (환각 방지).
6. 번역은 직역 아닌 비즈니스 톤의 자연스러운 의역.
```

### 1.3 User Prompt 템플릿

```typescript
function buildAnalysisPrompt(input: AnalysisInput): string {
  return `# 사용자 컨텍스트
회사: ${input.user_context.company}
업종: ${input.user_context.industry}
주력 제품: ${input.user_context.products.join(", ")}
타겟 고객: ${input.user_context.target_customers.join(", ")}
경쟁사: ${input.user_context.competitors.join(", ")}

# 처리할 뉴스
- 매체: ${input.news.publisher}
- 발행: ${input.news.published_at}
- 매칭된 키워드: "${input.keyword_matched.keyword}" (그룹: ${input.keyword_matched.group})
- 원어: ${input.news.original_lang}

원문 제목: ${input.news.title}

원문 본문:
${input.news.body.slice(0, 2000)}

# 수행 작업

1. **번역** (title_translated, summary_translated):
   - 원문이 한국어가 아니면 자연스러운 한국어로 번역
   - 비즈니스 톤, 직역 아닌 의역
   - 이미 한국어면 원문 보존

2. **요약** (summary_translated):
   - 본문을 3~4문장의 한국어로 요약
   - 숫자·고유명사는 보존
   - 50자 단위 문장으로 압축

3. **카테고리 분류** (category):
   - 매칭된 키워드 그룹을 참고하되, 더 정확한 세부 카테고리 부여
   - 예: "AI 보안 시장 동향", "경쟁사 제품 출시", "고객사 사례"

4. **점수**:
   - relevance_score (0~1): 사용자 회사·제품과의 관련도
   - importance_score (0~1): 업계 전반에서의 중요도 (대형 인수, 정책, 사고 등은 높게)

5. **시사점 생성** (implications):
   - sales_opportunity: 영업·마케팅에 어떻게 활용할 수 있는가 (구체적 액션)
   - target_customer: 이 뉴스에 반응할 가능성 높은 고객 세그먼트
   - risk_signal: 위협 또는 시장 변화 시그널 (없으면 빈 문자열)

6. **태그** (tags): 검색·필터링용 핵심 키워드 3~6개

7. **추천 액션** (recommended_action): 한 줄 권고
   - 예: "주간 영업회의 안건", "타겟 고객 A 담당자에게 공유", "참고만"

# 출력 형식 (반드시 이 JSON 구조만 출력)

{
  "language": {
    "original": "ko" | "en" | "ja" | "zh" | ...,
    "translated_to": "ko"
  },
  "title_translated": "string",
  "summary_translated": "string",
  "category": "string",
  "relevance_score": number,
  "importance_score": number,
  "implications": {
    "sales_opportunity": "string",
    "target_customer": "string",
    "risk_signal": "string"
  },
  "tags": ["string"],
  "recommended_action": "string"
}`;
}
```

### 1.4 출력 검증 (Zod)

```typescript
import { z } from "zod";

export const NewsAnalysisSchema = z.object({
  language: z.object({
    original: z.string(),
    translated_to: z.literal("ko"),
  }),
  title_translated: z.string().min(1).max(200),
  summary_translated: z.string().min(1).max(800),
  category: z.string().min(1).max(50),
  relevance_score: z.number().min(0).max(1),
  importance_score: z.number().min(0).max(1),
  implications: z.object({
    sales_opportunity: z.string(),
    target_customer: z.string(),
    risk_signal: z.string(),
  }),
  tags: z.array(z.string()).min(0).max(10),
  recommended_action: z.string().max(200),
});

export type NewsAnalysis = z.infer<typeof NewsAnalysisSchema>;
```

### 1.5 호출 함수

```typescript
// lib/llm/analyze.ts
import Anthropic from "@anthropic-ai/sdk";
import { NewsAnalysisSchema, type NewsAnalysis } from "./schema";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function analyzeNews(input: AnalysisInput): Promise<NewsAnalysis> {
  const userPrompt = buildAnalysisPrompt(input);

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => (block as { type: "text"; text: string }).text)
    .join("");

  const clean = text.replace(/```json\n?|```\n?/g, "").trim();
  const parsed = JSON.parse(clean);

  return NewsAnalysisSchema.parse(parsed);
}

export async function analyzeNewsWithRetry(
  input: AnalysisInput,
  maxRetries = 2
): Promise<NewsAnalysis | null> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await analyzeNews(input);
    } catch (error) {
      console.error(`Analysis attempt ${attempt + 1} failed:`, error);
      if (attempt === maxRetries) return null;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  return null;
}
```

---

## 2. 키워드 추천 프롬프트

온보딩 시 "AI 추천 키워드" 버튼이 호출. 사용자 프로필 기반으로 키워드 12개 제안.

### 2.1 모델 설정

```typescript
{
  model: "claude-sonnet-4-6",
  max_tokens: 1000,
  temperature: 0.7,  // 다양성을 위해 조금 높게
}
```

### 2.2 Prompt

```typescript
function buildKeywordSuggestPrompt(profile: UserProfile): string {
  return `당신은 B2B 인텔리전스 분석가입니다. 아래 사용자(기업)에게 매일 모니터링하면 좋을 키워드 12개를 4개 그룹으로 추천하세요.

회사: ${profile.company}
업종: ${profile.industry}
주력 제품: ${profile.products.join(", ")}

추천 원칙:
- 각 그룹에 정확히 3개씩 (경쟁사 / 업계 동향 / 제품·기술 / 일반 시장)
- 너무 일반적인 단어는 피함 ("AI" 같은 단일 단어 X, "AI 보안 시장" 같은 구체적 표현 O)
- 한국어 또는 영어 키워드 (글로벌 뉴스 수집에 적합한)
- 검색 시 noise가 적도록 2~4단어 조합 권장

출력 형식 (반드시 이 JSON 구조만):
{
  "competitor": ["string", "string", "string"],
  "industry": ["string", "string", "string"],
  "product": ["string", "string", "string"],
  "general": ["string", "string", "string"]
}`;
}

export const KeywordSuggestionSchema = z.object({
  competitor: z.array(z.string()).length(3),
  industry: z.array(z.string()).length(3),
  product: z.array(z.string()).length(3),
  general: z.array(z.string()).length(3),
});
```

---

## 3. 본문 전체 번역 프롬프트 (요청 시 lazy 로드)

사용자가 "전체 본문 번역" 버튼 클릭 시. 캐시되어 두 번째부터는 호출 안 됨.

### 3.1 모델 설정

```typescript
{
  model: "claude-haiku-4-5-20251001",  // 본문은 Haiku로 충분 (비용 절감)
  max_tokens: 4000,
  temperature: 0.2,
}
```

### 3.2 Prompt

```typescript
function buildBodyTranslationPrompt(body: string, sourceLang: string): string {
  return `다음 ${sourceLang} 뉴스 본문을 자연스러운 한국어로 번역하세요.

원칙:
- 비즈니스 톤, 직역 아닌 의역
- 숫자·고유명사·인용문은 보존
- 단락 구조 유지
- 번역문만 출력. 설명, 주석, "번역:" 등 부가 텍스트 금지.

원문:
${body}`;
}
```

---

## 4. 사전 필터링 휴리스틱 (LLM 미사용)

LLM 호출 전 단순 휴리스틱으로 노이즈 거름. 비용 절감 핵심.

```typescript
// lib/dedup.ts
export function shouldSkipForLLM(news: NewsItem): boolean {
  // 1. 본문이 너무 짧음
  if (!news.body_original || news.body_original.length < 200) return true;

  // 2. 광고성 제목
  const adKeywords = [
    "이벤트", "프로모션", "할인", "쿠폰", "추첨",
    "출시 기념", "런칭 이벤트", "구매 시"
  ];
  if (adKeywords.some((kw) => news.title_original.includes(kw))) return true;

  // 3. 매체 신뢰도 낮음 (선택적, 블랙리스트 운영)
  const lowQualityDomains = ["example-spam.com"];
  if (lowQualityDomains.includes(news.publisher_domain || "")) return true;

  return false;
}
```

---

## 5. 임베딩 생성 (OpenAI)

dedup·유사도 계산용. Claude가 아닌 OpenAI 사용 (비용 압도적으로 저렴).

```typescript
// lib/embed.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function createEmbedding(text: string): Promise<number[]> {
  const truncated = text.slice(0, 8000);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: truncated,
  });
  return response.data[0].embedding;
}

export async function createEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts.map((t) => t.slice(0, 8000)),
  });
  return response.data.map((d) => d.embedding);
}
```

---

## 6. 프롬프트 튜닝 가이드

베타 운영 중 시사점 품질이 떨어지면 다음을 시도:

### 6.1 Few-shot 예시 추가
시스템 프롬프트에 좋은 시사점 예시 1~2개 추가:

```
예시:
입력: OpenAI가 보안 전문 법인 설립
좋은 시사점:
  sales_opportunity: "금융권 제안서에 'AI 보안 트렌드' 근거로 활용. CISO들이 가장 우려하는 LLM 학습 데이터 보호 메시지 강화."
나쁜 시사점 (피해야 할 예):
  sales_opportunity: "AI 보안 시장이 커지고 있으므로 영업 기회가 있습니다." (너무 일반론)
```

### 6.2 사용자 프로필 디테일 강화
온보딩에서 다음을 추가 수집:
- 주요 매출원 (제품별 매출 비중)
- 최근 영업 케이스 (어떤 제안서가 통했는지)
- 경쟁에서 진 사례 (왜 졌는지)

### 6.3 temperature 조정
- 시사점이 너무 비슷비슷하면 0.3 → 0.5로
- 환각이 심하면 0.3 → 0.1로

---

## 7. 토큰 비용 모니터링

모든 LLM 호출은 `api_usage_log`에 기록:

```typescript
async function logUsage(
  source: string,
  userId: string | null,
  response: Anthropic.Message
) {
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  // Sonnet 4.6 단가
  const costUsd =
    (inputTokens * 3 + outputTokens * 15) / 1_000_000;

  await db.insert(apiUsageLog).values({
    source,
    user_id: userId,
    token_input: inputTokens,
    token_output: outputTokens,
    cost_usd: costUsd,
    status: "success",
  });
}
```

운영 대시보드(`/admin`)에서 일별 비용 추이 확인.
