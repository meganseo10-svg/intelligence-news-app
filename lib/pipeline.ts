import { and, eq } from "drizzle-orm";
import {
  db,
  newsItems,
  translations,
  insights,
  userNewsFeed,
  keywords,
  keywordGroups,
  userProfiles,
} from "@/db";
import {
  canonicalizeUrl,
  findOrCreateCluster,
  shouldSkipForLLM,
} from "@/lib/dedup";
import { createEmbedding } from "@/lib/embed";
import { analyzeNewsWithRetry } from "@/lib/llm/analyze";
import { collectForKeyword, type SourceKey } from "@/lib/sources";
import { extractArticleText } from "@/lib/sources/extract";
import type { CollectedNewsItem } from "@/lib/types";

const MIN_RELEVANCE = 0.3; // 이 미만이면 무관 기사로 보고 피드에서 제외

const GROUP_LABEL: Record<string, string> = {
  competitor: "경쟁사",
  industry: "업계 동향",
  product: "제품·기술",
  general: "일반",
};

export interface UserFeedStats {
  userId: string;
  collected: number;
  afterDedup: number;
  skippedHeuristic: number;
  skippedExisting: number;
  skippedLowRelevance: number;
  analyzed: number;
  analyzeFailed: number;
  feedItems: number;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** 한 사용자의 활성 키워드로 뉴스를 수집·분석·적재한다. */
export async function processUserFeed(
  userId: string,
  opts: { maxItems?: number } = {},
): Promise<UserFeedStats> {
  const maxItems = opts.maxItems ?? 10;
  const stats: UserFeedStats = {
    userId,
    collected: 0,
    afterDedup: 0,
    skippedHeuristic: 0,
    skippedExisting: 0,
    skippedLowRelevance: 0,
    analyzed: 0,
    analyzeFailed: 0,
    feedItems: 0,
  };

  // 1) 프로필 + 활성 키워드 로드
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  if (!profile) return stats;

  const kws = await db
    .select({
      id: keywords.id,
      term: keywords.term,
      sources: keywords.sources,
      category: keywordGroups.category,
    })
    .from(keywords)
    .innerJoin(keywordGroups, eq(keywords.groupId, keywordGroups.id))
    .where(and(eq(keywordGroups.userId, userId), eq(keywords.isActive, true)));
  if (kws.length === 0) return stats;

  const competitors = kws
    .filter((k) => k.category === "competitor")
    .map((k) => k.term);

  // 2) 키워드별 수집 → 통합 dedup (url_canonical)
  const byUrl = new Map<
    string,
    {
      item: CollectedNewsItem;
      keyword: string;
      keywordId: string;
      group: string;
    }
  >();
  // 키워드별로 수집 (나중에 round-robin으로 섞어서 카테고리 편중 방지)
  const perKeyword: { kw: (typeof kws)[number]; items: CollectedNewsItem[] }[] =
    [];
  for (const kw of kws) {
    const sources = (
      Array.isArray(kw.sources) ? kw.sources : ["naver", "gnews", "rss"]
    ) as SourceKey[];
    try {
      const items = await collectForKeyword(kw.term, sources);
      stats.collected += items.length;
      perKeyword.push({ kw, items });
    } catch (e) {
      console.warn(`[pipeline] '${kw.term}' 수집 실패:`, e);
    }
  }

  // round-robin 병합 + url_canonical dedup
  const maxLen = Math.max(0, ...perKeyword.map((p) => p.items.length));
  for (let i = 0; i < maxLen; i++) {
    for (const { kw, items } of perKeyword) {
      const item = items[i];
      if (!item) continue;
      const canon = canonicalizeUrl(item.url);
      if (!byUrl.has(canon)) {
        byUrl.set(canon, {
          item,
          keyword: kw.term,
          keywordId: kw.id,
          group: kw.category,
        });
      }
    }
  }
  stats.afterDedup = byUrl.size;

  // 3) 항목별 처리 (비용·시간 제한 위해 maxItems 까지)
  const feedDate = todayStr();
  let processed = 0;
  for (const { item, keyword, keywordId, group } of byUrl.values()) {
    if (processed >= maxItems) break;

    const canon = canonicalizeUrl(item.url);

    // 이미 적재된 뉴스인가?
    const [existing] = await db
      .select({ id: newsItems.id })
      .from(newsItems)
      .where(eq(newsItems.urlCanonical, canon))
      .limit(1);

    if (existing) {
      const [fed] = await db
        .select({ id: userNewsFeed.id })
        .from(userNewsFeed)
        .where(
          and(
            eq(userNewsFeed.userId, userId),
            eq(userNewsFeed.newsId, existing.id),
            eq(userNewsFeed.feedDate, feedDate),
          ),
        )
        .limit(1);
      if (fed) {
        stats.skippedExisting++;
        continue;
      }
    }

    // 휴리스틱 필터
    if (shouldSkipForLLM(item)) {
      stats.skippedHeuristic++;
      continue;
    }

    processed++;

    // 전체 본문 가져오기 (실패 시 검색 스니펫으로 폴백)
    const fullBody =
      (await extractArticleText(item.url)) ??
      item.body_original ??
      item.title_original;

    // 신규 뉴스면 임베딩+클러스터+적재
    let newsId: string;
    if (existing) {
      newsId = existing.id;
    } else {
      try {
        const embedding = await createEmbedding(
          `${item.title_original}\n${fullBody}`.slice(0, 4000),
        );
        const cluster = await findOrCreateCluster(embedding);
        const [inserted] = await db
          .insert(newsItems)
          .values({
            url: item.url,
            urlCanonical: canon,
            publisher: item.publisher,
            publisherDomain: item.publisher_domain,
            originalLang: item.original_lang,
            titleOriginal: item.title_original,
            bodyOriginal: fullBody,
            thumbnailUrl: item.thumbnail_url,
            publishedAt: item.published_at ? new Date(item.published_at) : null,
            source: item.source,
            clusterId: cluster.clusterId,
            embedding,
          })
          .onConflictDoUpdate({
            target: newsItems.urlCanonical,
            set: { collectedAt: new Date() },
          })
          .returning({ id: newsItems.id });
        newsId = inserted.id;
      } catch (e) {
        console.warn(`[pipeline] 적재 실패 '${item.title_original}':`, e);
        continue;
      }
    }

    // LLM 분석
    const analysis = await analyzeNewsWithRetry(
      {
        user_context: {
          company: profile.company ?? "",
          industry: profile.industry ?? "",
          products: profile.products ?? [],
          target_customers: profile.targetCustomers ?? [],
          competitors,
          trendFocus: profile.trendFocus,
          strengths: profile.strengths,
          weaknesses: profile.weaknesses,
          salesFocus: profile.salesFocus,
          threats: profile.threats,
        },
        news: {
          publisher: item.publisher,
          published_at: item.published_at,
          original_lang: item.original_lang,
          title: item.title_original,
          body: fullBody,
        },
        keyword_matched: { keyword, group: GROUP_LABEL[group] ?? group },
      },
      userId,
    );
    if (!analysis) {
      stats.analyzeFailed++;
      continue;
    }
    stats.analyzed++;

    // 관련도 낮은(무관) 기사는 피드에서 제외
    if (analysis.relevance_score < MIN_RELEVANCE) {
      stats.skippedLowRelevance++;
      continue;
    }

    // 저장: translations(글로벌) + insights(사용자) + user_news_feed
    try {
      await db
        .insert(translations)
        .values({
          newsId,
          targetLang: "ko",
          titleTranslated: analysis.title_translated,
          summaryTranslated: analysis.summary_translated,
        })
        .onConflictDoNothing();

      await db
        .insert(insights)
        .values({
          newsId,
          userId,
          category: analysis.category,
          relevanceScore: analysis.relevance_score,
          importanceScore: analysis.importance_score,
          salesOpportunity: analysis.implications.sales_opportunity,
          targetCustomer: analysis.implications.target_customer,
          riskSignal: analysis.implications.risk_signal,
          tags: analysis.tags,
          recommendedAction: analysis.recommended_action,
        })
        .onConflictDoNothing();

      await db
        .insert(userNewsFeed)
        .values({ userId, newsId, keywordId, feedDate })
        .onConflictDoNothing();

      stats.feedItems++;
    } catch (e) {
      console.warn(`[pipeline] 저장 실패:`, e);
    }
  }

  return stats;
}

/** 활성 사용자 전체를 청크 단위로 처리 */
export async function runCollectForAllUsers(opts: {
  maxUsers?: number;
  maxItemsPerUser?: number;
  chunkSize?: number;
}): Promise<{ users: number; stats: UserFeedStats[] }> {
  const chunkSize = opts.chunkSize ?? 5;
  const activeUsers = await db
    .select({ userId: userProfiles.userId })
    .from(userProfiles)
    .where(eq(userProfiles.onboardingCompleted, true))
    .limit(opts.maxUsers ?? 1000);

  const allStats: UserFeedStats[] = [];
  for (let i = 0; i < activeUsers.length; i += chunkSize) {
    const chunk = activeUsers.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map((u) =>
        processUserFeed(u.userId, { maxItems: opts.maxItemsPerUser }).catch(
          (e): UserFeedStats => {
            console.error(`[pipeline] user ${u.userId} 실패:`, e);
            return {
              userId: u.userId,
              collected: 0,
              afterDedup: 0,
              skippedHeuristic: 0,
              skippedExisting: 0,
              skippedLowRelevance: 0,
              analyzed: 0,
              analyzeFailed: 0,
              feedItems: 0,
            };
          },
        ),
      ),
    );
    allStats.push(...results);
  }
  return { users: activeUsers.length, stats: allStats };
}
