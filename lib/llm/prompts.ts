export const SYSTEM_PROMPT = `당신은 B2B 인텔리전스 분석가입니다. 사용자(기업)에게 매일 큐레이션된 뉴스와 사용자 회사 관점의 비즈니스 시사점을 제공합니다.

작업 원칙:
1. 사용자 회사·제품 컨텍스트를 반드시 반영. 일반론 금지.
2. 정보가 부족하면 추측하지 말고 빈 문자열 또는 null 사용.
3. 정치적·종교적·민감한 주제는 중립적 톤 유지.
4. 출력은 반드시 지정된 JSON 형식만. 다른 텍스트(설명, 주석, 마크다운) 절대 금지.
5. 본문에 없는 정보를 임의로 추가하지 않음 (환각 방지).
6. 번역은 직역 아닌 비즈니스 톤의 자연스러운 의역.`;

export interface AnalysisInput {
  user_context: {
    company: string;
    industry: string;
    products: string[];
    target_customers: string[];
    competitors: string[];
  };
  news: {
    publisher: string;
    published_at: string;
    original_lang: string;
    title: string;
    body: string;
  };
  keyword_matched: {
    keyword: string;
    group: string;
  };
}

export function buildAnalysisPrompt(input: AnalysisInput): string {
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

3. **카테고리 분류** (category):
   - 매칭된 키워드 그룹을 참고하되, 더 정확한 세부 카테고리 부여

4. **점수**:
   - relevance_score (0~1): 사용자 회사·제품과의 관련도
   - importance_score (0~1): 업계 전반에서의 중요도

5. **시사점 생성** (implications):
   - sales_opportunity: 영업·마케팅 활용 방안 (구체적 액션)
   - target_customer: 반응할 가능성 높은 고객 세그먼트
   - risk_signal: 위협·시장 변화 시그널 (없으면 빈 문자열)

6. **태그** (tags): 검색·필터링용 핵심 키워드 3~6개

7. **추천 액션** (recommended_action): 한 줄 권고

# 출력 형식 (반드시 이 JSON 구조만 출력)

{
  "language": { "original": "ko" | "en" | ..., "translated_to": "ko" },
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

export interface KeywordSuggestProfile {
  company: string;
  industry: string;
  products: string[];
}

export function buildKeywordSuggestPrompt(
  profile: KeywordSuggestProfile,
): string {
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

export function buildBodyTranslationPrompt(
  body: string,
  sourceLang: string,
): string {
  return `다음 ${sourceLang} 뉴스 본문을 자연스러운 한국어로 번역하세요.

원칙:
- 비즈니스 톤, 직역 아닌 의역
- 숫자·고유명사·인용문은 보존
- 단락 구조 유지
- 번역문만 출력. 설명, 주석, "번역:" 등 부가 텍스트 금지.

원문:
${body}`;
}
