import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface InsightsSummary {
  days: number;
  total: number;
  byCategory: { category: string; count: number }[];
  bySource: { label: string; count: number }[];
  topTags: { tag: string; count: number }[];
}

const CATEGORY_LABEL: Record<string, string> = {
  competitor: "경쟁사",
  industry: "업계 동향",
  product: "제품·기술",
  general: "일반",
};

export async function getInsightsSummary(
  userId: string,
  days = 7,
): Promise<InsightsSummary> {
  const total =
    (
      (await db.execute(sql`
    select count(*)::int as c from user_news_feed
    where user_id = ${userId} and feed_date >= current_date - ${days}::int
  `)) as unknown as { c: number }[]
    )[0]?.c ?? 0;

  const catRows = (await db.execute(sql`
    select kg.category as category, count(*)::int as c
    from user_news_feed f
    join keywords k on f.keyword_id = k.id
    join keyword_groups kg on k.group_id = kg.id
    where f.user_id = ${userId} and f.feed_date >= current_date - ${days}::int
    group by kg.category
  `)) as unknown as { category: string; c: number }[];

  const srcRows = (await db.execute(sql`
    select n.source as source, count(*)::int as c
    from user_news_feed f
    join news_items n on f.news_id = n.id
    where f.user_id = ${userId} and f.feed_date >= current_date - ${days}::int
    group by n.source
  `)) as unknown as { source: string; c: number }[];

  const tagRows = (await db.execute(sql`
    select t.tag as tag, count(*)::int as c
    from insights i, unnest(i.tags) as t(tag)
    where i.user_id = ${userId}
      and i.created_at >= now() - make_interval(days => ${days})
    group by t.tag
    order by c desc
    limit 12
  `)) as unknown as { tag: string; c: number }[];

  // 국내(naver) / 해외(gnews,rss,manual) 집계
  let domestic = 0;
  let overseas = 0;
  for (const r of srcRows) {
    if (r.source === "naver") domestic += r.c;
    else overseas += r.c;
  }

  return {
    days,
    total,
    byCategory: catRows
      .map((r) => ({
        category: CATEGORY_LABEL[r.category] ?? r.category,
        count: r.c,
      }))
      .sort((a, b) => b.count - a.count),
    bySource: [
      { label: "국내", count: domestic },
      { label: "해외", count: overseas },
    ],
    topTags: tagRows.map((r) => ({ tag: r.tag, count: r.c })),
  };
}
