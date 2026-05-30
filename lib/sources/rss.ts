import Parser from "rss-parser";
import type { CollectedNewsItem } from "@/lib/types";
import { canonical, hostname } from "./util";

/** 초기 RSS 피드 목록 (추후 DB/관리자 설정으로 이동 가능) */
export const RSS_FEEDS: { name: string; url: string }[] = [
  // 글로벌 기술·비즈니스 매체
  { name: "TechCrunch", url: "https://techcrunch.com/feed/" },
  { name: "The Verge", url: "https://www.theverge.com/rss/index.xml" },
  {
    name: "Ars Technica",
    url: "https://feeds.arstechnica.com/arstechnica/index",
  },
  { name: "VentureBeat", url: "https://venturebeat.com/feed/" },
  { name: "Wired", url: "https://www.wired.com/feed/rss" },
  { name: "Engadget", url: "https://www.engadget.com/rss.xml" },
  {
    name: "BBC Technology",
    url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
  },
  {
    name: "BBC Business",
    url: "https://feeds.bbci.co.uk/news/business/rss.xml",
  },
  {
    name: "MIT Technology Review",
    url: "https://www.technologyreview.com/feed/",
  },
  { name: "Hacker News", url: "https://hnrss.org/frontpage" },
  { name: "ZDNET", url: "https://www.zdnet.com/news/rss.xml" },
];

const parser = new Parser({ timeout: 10000 });

export interface RssSearchOptions {
  withinHours?: number; // 기본 24시간
}

/** RSS 피드들을 읽어 키워드가 제목/요약에 포함되고 기간 내인 항목만 수집 */
export async function searchRss(
  keyword: string,
  options: RssSearchOptions = {},
): Promise<CollectedNewsItem[]> {
  const withinHours = options.withinHours ?? 24;
  const cutoff = Date.now() - withinHours * 3600_000;
  const kw = keyword.toLowerCase();
  const results: CollectedNewsItem[] = [];

  await Promise.allSettled(
    RSS_FEEDS.map(async (feed) => {
      try {
        const parsed = await parser.parseURL(feed.url);
        for (const item of parsed.items) {
          const title = item.title ?? "";
          const summary = item.contentSnippet ?? item.content ?? "";
          if (!`${title} ${summary}`.toLowerCase().includes(kw)) continue;

          const publishedMs = item.isoDate
            ? new Date(item.isoDate).getTime()
            : Date.now();
          if (publishedMs < cutoff) continue;

          const link = item.link ?? "";
          if (!link) continue;

          results.push({
            url: link,
            url_canonical: canonical(link),
            publisher: feed.name,
            publisher_domain: hostname(link),
            original_lang: "en",
            title_original: title,
            body_original: summary || null,
            thumbnail_url: null,
            published_at: new Date(publishedMs).toISOString(),
            source: "rss",
          });
        }
      } catch (e) {
        console.warn(
          `[rss] ${feed.name} 피드 읽기 실패:`,
          e instanceof Error ? e.message : e,
        );
      }
    }),
  );

  return results;
}
