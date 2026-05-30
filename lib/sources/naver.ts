import pLimit from "p-limit";
import type { CollectedNewsItem } from "@/lib/types";

// 네이버 QPS 보호용 동시 요청 제한
const limit = pLimit(5);

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function hostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function canonical(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status === 429 || res.status >= 500) {
        throw new Error(`HTTP ${res.status}`);
      }
      return res;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * 2 ** i)); // 0.3s, 0.6s, 1.2s
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("네이버 요청 실패");
}

interface NaverNewsApiItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

export interface NaverSearchOptions {
  display?: number; // 1~100, 기본 20
  sort?: "date" | "sim"; // 기본 date
}

/** 네이버 뉴스 검색 → CollectedNewsItem[] */
export async function searchNaverNews(
  keyword: string,
  options: NaverSearchOptions = {},
): Promise<CollectedNewsItem[]> {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "네이버 API 키(NAVER_CLIENT_ID / NAVER_CLIENT_SECRET)가 설정되지 않았습니다.",
    );
  }

  const display = Math.min(Math.max(options.display ?? 20, 1), 100);
  const sort = options.sort ?? "date";
  const endpoint = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    keyword,
  )}&display=${display}&sort=${sort}`;

  const res = await limit(() =>
    fetchWithRetry(endpoint, {
      headers: {
        "X-Naver-Client-Id": clientId,
        "X-Naver-Client-Secret": clientSecret,
      },
    }),
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`네이버 검색 실패 (HTTP ${res.status}): ${text}`);
  }

  const json = (await res.json()) as { items?: NaverNewsApiItem[] };
  const items = json.items ?? [];

  return items.map((it): CollectedNewsItem => {
    const link = it.originallink || it.link;
    return {
      url: link,
      url_canonical: canonical(link),
      publisher: hostname(link) ?? "naver",
      publisher_domain: hostname(link),
      original_lang: "ko",
      title_original: stripHtml(it.title),
      body_original: stripHtml(it.description) || null,
      thumbnail_url: null,
      published_at: it.pubDate
        ? new Date(it.pubDate).toISOString()
        : new Date().toISOString(),
      source: "naver",
    };
  });
}
