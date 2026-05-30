import { and, desc, eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db, savedNews, newsItems, insights, translations } from "@/db";
import { NewsCard, type FeedItem } from "@/components/feed/NewsCard";
import { SavedNote } from "@/components/feed/SavedNote";

export default async function SavedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rows = await db
    .select({
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
      category: insights.category,
      importanceScore: insights.importanceScore,
      salesOpportunity: insights.salesOpportunity,
      targetCustomer: insights.targetCustomer,
      riskSignal: insights.riskSignal,
      tags: insights.tags,
      userNote: savedNews.userNote,
      savedAt: savedNews.savedAt,
    })
    .from(savedNews)
    .innerJoin(newsItems, eq(savedNews.newsId, newsItems.id))
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
    .where(eq(savedNews.userId, user!.id))
    .orderBy(desc(savedNews.savedAt));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="mb-4 text-xl font-medium">저장한 뉴스 ({rows.length})</h1>

      {rows.length === 0 ? (
        <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
          아직 저장한 뉴스가 없어요. 피드에서 카드의 “저장”을 눌러보세요.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const item: FeedItem = {
              feedId: r.newsId,
              news: {
                id: r.newsId,
                url: r.url,
                publisher: r.publisher,
                publisherDomain: r.publisherDomain,
                originalLang: r.originalLang,
                titleOriginal: r.titleOriginal,
                bodyOriginal: r.bodyOriginal,
                publishedAt: r.publishedAt
                  ? new Date(r.publishedAt).toISOString()
                  : null,
              },
              titleTranslated: r.titleTranslated,
              summaryTranslated: r.summaryTranslated,
              groupCategory: null,
              isSaved: true,
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
            };
            return (
              <div key={r.newsId}>
                <NewsCard item={item} />
                <SavedNote newsId={r.newsId} initialNote={r.userNote ?? ""} />
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
