import type { CollectedNewsItem } from "@/lib/types";
import { canonicalizeUrl } from "@/lib/dedup";
import { searchNaverNews } from "./naver";
import { searchGNews } from "./gnews";
import { searchRss } from "./rss";

export type SourceKey = "naver" | "gnews" | "rss";

export interface CollectOptions {
  /** gnews 검색 언어 (기본 en) */
  gnewsLang?: string;
}

/**
 * 한 키워드에 대해 지정한 소스들에서 뉴스를 병렬 수집한다.
 * - Promise.allSettled 로 한 소스 실패가 전체로 번지지 않게 격리
 * - url_canonical 기준 1차 중복 제거
 */
export async function collectForKeyword(
  keyword: string,
  sources: SourceKey[] = ["naver", "gnews", "rss"],
  options: CollectOptions = {},
): Promise<CollectedNewsItem[]> {
  const tasks: {
    source: SourceKey;
    run: () => Promise<CollectedNewsItem[]>;
  }[] = [];
  if (sources.includes("naver"))
    tasks.push({ source: "naver", run: () => searchNaverNews(keyword) });
  if (sources.includes("gnews"))
    tasks.push({
      source: "gnews",
      // 언어 미지정 → 전 세계(모든 언어) 결과로 글로벌 커버리지 강화
      run: () =>
        searchGNews(
          keyword,
          options.gnewsLang ? { lang: options.gnewsLang } : {},
        ),
    });
  if (sources.includes("rss"))
    tasks.push({ source: "rss", run: () => searchRss(keyword) });

  const settled = await Promise.allSettled(tasks.map((t) => t.run()));

  const all: CollectedNewsItem[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") {
      all.push(...r.value);
    } else {
      console.warn(
        `[collect] '${keyword}' ${tasks[i].source} 실패:`,
        r.reason instanceof Error ? r.reason.message : r.reason,
      );
    }
  });

  // url_canonical 기준 1차 dedup (정규화 재적용)
  const seen = new Set<string>();
  const deduped: CollectedNewsItem[] = [];
  for (const item of all) {
    const canon = canonicalizeUrl(item.url);
    if (seen.has(canon)) continue;
    seen.add(canon);
    deduped.push({ ...item, url_canonical: canon });
  }
  return deduped;
}
