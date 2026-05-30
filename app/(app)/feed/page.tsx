import Link from "next/link";
import { Suspense } from "react";
import { and, desc, eq } from "drizzle-orm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  db,
  userNewsFeed,
  newsItems,
  insights,
  translations,
  keywords,
  keywordGroups,
  savedNews,
} from "@/db";
import { NewsCard, type FeedItem } from "@/components/feed/NewsCard";
import { CategoryTabs } from "@/components/feed/CategoryTabs";

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: { date?: string; category?: string; q?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const today = new Date().toISOString().slice(0, 10);
  const date = searchParams.date ?? today;
  const category = searchParams.category ?? "all";
  const q = (searchParams.q ?? "").trim().toLowerCase();

  const rows = await db
    .select({
      feedId: userNewsFeed.id,
      newsId: newsItems.id,
      url: newsItems.url,
      publisher: newsItems.publisher,
      publisherDomain: newsItems.publisherDomain,
      originalLang: newsItems.originalLang,
      titleOriginal: newsItems.titleOriginal,
      bodyOriginal: newsItems.bodyOriginal,
      publishedAt: newsItems.publishedAt,
      titleTranslated: translations.titleTranslated,
      summaryTranslated: translations.summaryTranslated,
      groupCategory: keywordGroups.category,
      category: insights.category,
      importanceScore: insights.importanceScore,
      salesOpportunity: insights.salesOpportunity,
      targetCustomer: insights.targetCustomer,
      riskSignal: insights.riskSignal,
      tags: insights.tags,
      savedId: savedNews.id,
    })
    .from(userNewsFeed)
    .innerJoin(newsItems, eq(userNewsFeed.newsId, newsItems.id))
    .leftJoin(
      insights,
      and(eq(insights.newsId, newsItems.id), eq(insights.userId, user!.id)),
    )
    .leftJoin(
      translations,
      and(
        eq(translations.newsId, newsItems.id),
        eq(translations.targetLang, "ko"),
      ),
    )
    .leftJoin(keywords, eq(userNewsFeed.keywordId, keywords.id))
    .leftJoin(keywordGroups, eq(keywords.groupId, keywordGroups.id))
    .leftJoin(
      savedNews,
      and(eq(savedNews.newsId, newsItems.id), eq(savedNews.userId, user!.id)),
    )
    .where(
      and(eq(userNewsFeed.userId, user!.id), eq(userNewsFeed.feedDate, date)),
    )
    .orderBy(desc(insights.importanceScore));

  const all: FeedItem[] = rows.map((r) => ({
    feedId: r.feedId,
    news: {
      id: r.newsId,
      url: r.url,
      publisher: r.publisher,
      publisherDomain: r.publisherDomain,
      originalLang: r.originalLang,
      titleOriginal: r.titleOriginal,
      bodyOriginal: r.bodyOriginal,
      publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : null,
    },
    titleTranslated: r.titleTranslated,
    summaryTranslated: r.summaryTranslated,
    groupCategory: r.groupCategory,
    isSaved: !!r.savedId,
    insight: r.category
      ? {
          category: r.category,
          importanceScore: r.importanceScore,
          salesOpportunity: r.salesOpportunity,
          targetCustomer: r.targetCustomer,
          riskSignal: r.riskSignal,
          tags: r.tags,
        }
      : null,
  }));

  // 카테고리별 카운트
  const counts: Record<string, number> = { all: all.length };
  for (const it of all) {
    if (it.groupCategory) {
      counts[it.groupCategory] = (counts[it.groupCategory] ?? 0) + 1;
    }
  }

  // 필터 적용
  let items = all;
  if (category !== "all") {
    items = items.filter((it) => it.groupCategory === category);
  }
  if (q) {
    items = items.filter((it) =>
      `${it.news.titleOriginal} ${it.titleTranslated ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">오늘의 인텔리전스</h1>
          <p className="text-sm text-muted-foreground">
            {date} · 뉴스 {all.length}건
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/feed?date=${addDays(date, -1)}`}
            className="rounded-md border px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
            aria-label="이전 날"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          {date !== today && (
            <Link
              href={`/feed?date=${addDays(date, 1)}`}
              className="rounded-md border px-2 py-1 text-sm text-muted-foreground hover:bg-muted"
              aria-label="다음 날"
            >
              <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      <Suspense fallback={null}>
        <CategoryTabs counts={counts} date={date} />
      </Suspense>

      {items.length === 0 ? (
        <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
          {all.length === 0
            ? "이 날짜에 수집된 뉴스가 없어요."
            : "이 조건에 맞는 뉴스가 없어요."}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <NewsCard key={item.feedId} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
