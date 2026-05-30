import { config } from "dotenv";
config({ path: ".env.local" });

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, inArray } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";
import * as schema from "../db/schema";

const {
  userProfiles,
  keywordGroups,
  keywords,
  newsItems,
  insights,
  userNewsFeed,
  notificationSettings,
} = schema;

const TEST_EMAIL = "test@intelligence.local";
const TEST_PASSWORD = "test1234!";

/** 시드용 뉴스 10건 (한국어 + 영어 혼합) */
const NEWS_SEED = [
  {
    source: "naver",
    originalLang: "ko",
    publisher: "테크뉴스",
    publisherDomain: "technews.co.kr",
    titleOriginal: "오픈AI, 한국 시장 본격 진출…기업용 서비스 강화",
    bodyOriginal:
      "오픈AI가 한국 지사를 설립하고 기업용 AI 솔루션 영업을 본격화한다고 밝혔다.",
    url: "https://technews.co.kr/news/openai-korea-2026",
    category: "competitor",
  },
  {
    source: "naver",
    originalLang: "ko",
    publisher: "AI타임스",
    publisherDomain: "aitimes.com",
    titleOriginal: "앤트로픽 Claude, 국내 대기업 도입 사례 확산",
    bodyOriginal:
      "앤트로픽의 Claude가 국내 금융·제조 대기업에 잇따라 도입되고 있다.",
    url: "https://aitimes.com/news/anthropic-claude-kr",
    category: "competitor",
  },
  {
    source: "gnews",
    originalLang: "en",
    publisher: "TechCrunch",
    publisherDomain: "techcrunch.com",
    titleOriginal: "OpenAI launches new enterprise tier with custom models",
    bodyOriginal:
      "OpenAI announced an enterprise tier letting companies fine-tune private models.",
    url: "https://techcrunch.com/2026/05/openai-enterprise-tier",
    category: "competitor",
  },
  {
    source: "gnews",
    originalLang: "en",
    publisher: "Reuters",
    publisherDomain: "reuters.com",
    titleOriginal: "Anthropic raises new funding round at higher valuation",
    bodyOriginal:
      "Anthropic closed a new funding round, signaling strong investor demand for AI safety-focused labs.",
    url: "https://reuters.com/tech/anthropic-funding-2026",
    category: "competitor",
  },
  {
    source: "naver",
    originalLang: "ko",
    publisher: "한국경제",
    publisherDomain: "hankyung.com",
    titleOriginal: "생성형 AI 시장, 2026년 두 배 성장 전망",
    bodyOriginal:
      "국내 생성형 AI 시장이 올해 전년 대비 두 배 가까이 성장할 것으로 전망된다.",
    url: "https://hankyung.com/it/genai-market-2026",
    category: "industry",
  },
  {
    source: "rss",
    originalLang: "en",
    publisher: "The Verge",
    publisherDomain: "theverge.com",
    titleOriginal: "B2B SaaS companies double down on AI copilots",
    bodyOriginal:
      "More B2B SaaS vendors are embedding AI copilots to boost retention and upsell.",
    url: "https://theverge.com/2026/05/b2b-saas-ai-copilots",
    category: "industry",
  },
  {
    source: "naver",
    originalLang: "ko",
    publisher: "벤처스퀘어",
    publisherDomain: "venturesquare.net",
    titleOriginal: "올해 1분기 스타트업 투자, AI 분야에 집중",
    bodyOriginal:
      "1분기 국내 스타트업 투자금의 절반 이상이 AI 관련 기업에 몰린 것으로 나타났다.",
    url: "https://venturesquare.net/startup-investment-q1-2026",
    category: "general",
  },
  {
    source: "gnews",
    originalLang: "en",
    publisher: "Bloomberg",
    publisherDomain: "bloomberg.com",
    titleOriginal: "Enterprise AI adoption accelerates across industries",
    bodyOriginal:
      "A new survey shows enterprise AI adoption accelerating, with knowledge work leading.",
    url: "https://bloomberg.com/news/enterprise-ai-adoption-2026",
    category: "industry",
  },
  {
    source: "rss",
    originalLang: "en",
    publisher: "Ars Technica",
    publisherDomain: "arstechnica.com",
    titleOriginal: "How embedding search is reshaping news curation",
    bodyOriginal:
      "Vector embeddings let products dedupe and cluster news at scale, improving relevance.",
    url: "https://arstechnica.com/2026/05/embedding-search-news",
    category: "product",
  },
  {
    source: "gnews",
    originalLang: "en",
    publisher: "VentureBeat",
    publisherDomain: "venturebeat.com",
    titleOriginal: "AI news curation startups attract enterprise customers",
    bodyOriginal:
      "Startups offering AI-powered news curation are landing B2B contracts with marketing teams.",
    url: "https://venturebeat.com/ai/news-curation-startups-2026",
    category: "product",
  },
];

/** 카테고리별 시사점 텍스트 (내 회사 관점) */
const INSIGHT_BY_CATEGORY: Record<
  string,
  {
    relevance: number;
    importance: number;
    sales: string;
    risk: string;
    action: string;
    tags: string[];
  }
> = {
  competitor: {
    relevance: 0.9,
    importance: 0.85,
    sales: "경쟁사 동향을 영업 자료의 차별화 포인트로 활용 가능",
    risk: "경쟁사가 같은 고객군을 공략할 수 있어 모니터링 필요",
    action: "경쟁사 대비 우리 제품의 강점을 정리한 비교표 업데이트",
    tags: ["경쟁사", "동향"],
  },
  industry: {
    relevance: 0.75,
    importance: 0.7,
    sales: "시장 성장 데이터를 제안서의 시장 규모 근거로 인용",
    risk: "시장 성장에 따라 신규 경쟁자 진입 가능성 증가",
    action: "최신 시장 통계를 영업/마케팅 자료에 반영",
    tags: ["시장", "트렌드"],
  },
  product: {
    relevance: 0.8,
    importance: 0.75,
    sales: "제품 기능과 직접 연결되는 기술 트렌드, 데모에 활용",
    risk: "기술 트렌드 미반영 시 제품 경쟁력 약화 우려",
    action: "관련 기능 로드맵 우선순위 재검토",
    tags: ["제품", "기술"],
  },
  general: {
    relevance: 0.6,
    importance: 0.55,
    sales: "투자 동향을 통해 잠재 고객의 자금 여력 파악",
    risk: "투자 위축 시 고객사 예산 축소 가능성",
    action: "투자 유치 기업 리스트를 잠재 고객 풀에 추가",
    tags: ["투자", "일반"],
  },
};

function canonical(url: string) {
  return url.replace(/[?#].*$/, "").replace(/\/$/, "");
}

function today() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function main() {
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  const db = drizzle(client, { schema });
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  try {
    // 1) 테스트 유저 확보 (없으면 생성 → 트리거가 user_profiles 자동 생성)
    let userId: string | undefined;
    const { data: list, error: listErr } = await admin.auth.admin.listUsers();
    if (listErr) throw listErr;
    const existing = list.users.find((u) => u.email === TEST_EMAIL);
    if (existing) {
      userId = existing.id;
      console.log("• 기존 테스트 유저 사용:", TEST_EMAIL);
    } else {
      const { data, error } = await admin.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
      if (error) throw error;
      userId = data.user.id;
      console.log("• 테스트 유저 생성:", TEST_EMAIL);
    }
    if (!userId) throw new Error("userId 확보 실패");

    // 2) 프로필 채우기 (트리거가 만든 row를 UPDATE; updated_at은 DB 트리거가 처리)
    await db
      .update(userProfiles)
      .set({
        company: "인텔리전스랩",
        industry: "B2B SaaS",
        companySize: "11-50",
        products: ["AI 뉴스 큐레이션", "시장 인텔리전스"],
        targetCustomers: ["스타트업 마케터", "전략기획팀"],
        onboardingCompleted: true,
      })
      .where(eq(userProfiles.userId, userId));

    // 3) 알림 설정 (없으면 기본값 생성)
    await db
      .insert(notificationSettings)
      .values({ userId })
      .onConflictDoNothing({ target: notificationSettings.userId });

    // 4) 키워드 그룹 + 키워드 (멱등: 기존 그룹 삭제 후 재생성, cascade로 키워드도 삭제)
    await db.delete(keywordGroups).where(eq(keywordGroups.userId, userId));
    const groupSeed = [
      { category: "competitor", name: "경쟁사", terms: ["오픈AI", "앤트로픽"] },
      { category: "industry", name: "업계", terms: ["생성형 AI", "B2B SaaS"] },
      {
        category: "product",
        name: "제품",
        terms: ["뉴스 큐레이션", "임베딩 검색"],
      },
      { category: "general", name: "일반", terms: ["스타트업 투자"] },
    ];
    for (let i = 0; i < groupSeed.length; i++) {
      const g = groupSeed[i];
      const [grp] = await db
        .insert(keywordGroups)
        .values({ userId, category: g.category, name: g.name, sortOrder: i })
        .returning({ id: keywordGroups.id });
      await db
        .insert(keywords)
        .values(g.terms.map((term) => ({ groupId: grp.id, term })));
    }

    // 5) 뉴스 10건 (멱등: url_canonical 충돌 무시)
    await db
      .insert(newsItems)
      .values(
        NEWS_SEED.map((n) => ({
          url: n.url,
          urlCanonical: canonical(n.url),
          publisher: n.publisher,
          publisherDomain: n.publisherDomain,
          originalLang: n.originalLang,
          titleOriginal: n.titleOriginal,
          bodyOriginal: n.bodyOriginal,
          source: n.source,
        })),
      )
      .onConflictDoNothing({ target: newsItems.urlCanonical });

    // 시드 뉴스 id 조회 (방금 넣었든 이미 있었든)
    const canonicals = NEWS_SEED.map((n) => canonical(n.url));
    const rows = await db
      .select({ id: newsItems.id, urlCanonical: newsItems.urlCanonical })
      .from(newsItems)
      .where(inArray(newsItems.urlCanonical, canonicals));
    const idByCanonical = new Map(rows.map((r) => [r.urlCanonical, r.id]));

    // 6) 시사점(insights) + 피드(user_news_feed) — 테스트 유저용
    const feedDate = today();
    for (const n of NEWS_SEED) {
      const newsId = idByCanonical.get(canonical(n.url));
      if (!newsId) continue;
      const tpl = INSIGHT_BY_CATEGORY[n.category];

      await db
        .insert(insights)
        .values({
          newsId,
          userId,
          category: n.category,
          relevanceScore: tpl.relevance,
          importanceScore: tpl.importance,
          salesOpportunity: tpl.sales,
          riskSignal: tpl.risk,
          recommendedAction: tpl.action,
          tags: tpl.tags,
        })
        .onConflictDoNothing();

      await db
        .insert(userNewsFeed)
        .values({ userId, newsId, feedDate })
        .onConflictDoNothing();
    }

    console.log(
      `✅ 시드 완료: 유저 1명, 키워드그룹 ${groupSeed.length}개, 뉴스 ${NEWS_SEED.length}건, 시사점/피드 ${NEWS_SEED.length}건`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("❌ 시드 실패:", err);
  process.exit(1);
});
