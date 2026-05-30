import type { CollectedNewsItem } from "@/lib/types";
import { getTodayUsageCount, logApiUsage } from "@/lib/usage";
import { canonical, hostname } from "./util";

const DAILY_LIMIT = 100; // GNews 무료 티어: 하루 100 요청

interface GNewsArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

export interface GNewsSearchOptions {
  lang?: string; // 지정하면 해당 언어, 미지정 시 전 세계(모든 언어) 결과
  max?: number; // 무료 티어 최대 10
}

/** GNews 검색 → CollectedNewsItem[] (한도 초과 시 빈 배열) */
export async function searchGNews(
  keyword: string,
  options: GNewsSearchOptions = {},
): Promise<CollectedNewsItem[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    throw new Error("GNEWS_API_KEY가 설정되지 않았습니다.");
  }

  // 무료 한도 확인
  const used = await getTodayUsageCount("gnews");
  if (used >= DAILY_LIMIT) {
    await logApiUsage({
      source: "gnews",
      status: "rate_limited",
      errorMessage: `daily limit ${DAILY_LIMIT} reached`,
    });
    console.warn(`[gnews] 일일 한도(${DAILY_LIMIT}) 초과 — 수집 건너뜀`);
    return [];
  }

  const max = Math.min(options.max ?? 10, 10);
  const langParam = options.lang ? `&lang=${options.lang}` : "";
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(
    keyword,
  )}${langParam}&max=${max}&apikey=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    await logApiUsage({ source: "gnews", status: `error_${res.status}` });
    const text = await res.text().catch(() => "");
    throw new Error(`GNews 실패 (HTTP ${res.status}): ${text}`);
  }

  const json = (await res.json()) as { articles?: GNewsArticle[] };
  await logApiUsage({ source: "gnews", status: "ok" });

  return (json.articles ?? []).map((a): CollectedNewsItem => {
    const domain = hostname(a.source?.url ?? a.url);
    return {
      url: a.url,
      url_canonical: canonical(a.url),
      publisher: a.source?.name ?? domain ?? "gnews",
      publisher_domain: domain,
      original_lang: options.lang ?? "en",
      title_original: a.title,
      body_original: a.description || null,
      thumbnail_url: a.image || null,
      published_at: a.publishedAt
        ? new Date(a.publishedAt).toISOString()
        : new Date().toISOString(),
      source: "gnews",
    };
  });
}
