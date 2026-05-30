import { and, desc, eq } from "drizzle-orm";
import { db, userNewsFeed, newsItems, insights, translations } from "@/db";
import type { DigestItem } from "@/emails/DailyDigest";

export type DigestItemWithScore = DigestItem & { importance: number };

/** 특정 사용자·날짜의 다이제스트용 뉴스 목록 (중요도순) */
export async function getDigestItems(
  userId: string,
  date: string,
  limit = 15,
): Promise<DigestItemWithScore[]> {
  const rows = await db
    .select({
      url: newsItems.url,
      publisher: newsItems.publisher,
      titleOriginal: newsItems.titleOriginal,
      bodyOriginal: newsItems.bodyOriginal,
      titleTranslated: translations.titleTranslated,
      summaryTranslated: translations.summaryTranslated,
      category: insights.category,
      importanceScore: insights.importanceScore,
      salesOpportunity: insights.salesOpportunity,
    })
    .from(userNewsFeed)
    .innerJoin(newsItems, eq(userNewsFeed.newsId, newsItems.id))
    .leftJoin(
      insights,
      and(eq(insights.newsId, newsItems.id), eq(insights.userId, userId)),
    )
    .leftJoin(
      translations,
      and(
        eq(translations.newsId, newsItems.id),
        eq(translations.targetLang, "ko"),
      ),
    )
    .where(
      and(eq(userNewsFeed.userId, userId), eq(userNewsFeed.feedDate, date)),
    )
    .orderBy(desc(insights.importanceScore))
    .limit(limit);

  return rows.map((r) => ({
    title: r.titleTranslated ?? r.titleOriginal,
    summary: r.summaryTranslated ?? r.bodyOriginal ?? "",
    category: r.category,
    salesOpportunity: r.salesOpportunity,
    publisher: r.publisher,
    url: r.url,
    importance: r.importanceScore ?? 0,
  }));
}
