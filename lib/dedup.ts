import { eq, sql } from "drizzle-orm";
import { db, newsClusters } from "@/db";
import type { CollectedNewsItem } from "@/lib/types";

// 제거할 추적용 쿼리 파라미터 패턴
const TRACKING_PARAM = [
  /^utm_/,
  /^ref$/,
  /^ref_/,
  /^source$/,
  /^fbclid$/,
  /^gclid$/,
  /^igshid$/,
  /^mc_/,
  /^spm$/,
  /^cmpid$/,
];

/**
 * URL 정규화 — 중복 판정을 위한 표준 형태로 변환.
 * - https로 통일, www/m/amp 등 서브도메인 제거 (모바일↔PC 통합)
 * - 추적 파라미터 제거 (나머지 쿼리는 유지: 기사 id 등이 있을 수 있음)
 * - 해시·트레일링 슬래시 제거
 */
export function canonicalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.protocol = "https:";
    u.hostname = u.hostname.replace(/^(www|m|amp|mobile)\./, "");

    const kept = new URLSearchParams();
    u.searchParams.forEach((v, k) => {
      if (!TRACKING_PARAM.some((re) => re.test(k.toLowerCase()))) {
        kept.set(k, v);
      }
    });
    u.search = kept.toString();
    u.hash = "";

    return u.toString().replace(/\/$/, "");
  } catch {
    return raw.trim();
  }
}

/** number[] 임베딩을 pgvector 텍스트 리터럴로 변환 */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export interface ClusterResult {
  clusterId: string;
  isNew: boolean;
}

/**
 * 임베딩 기반 의미 중복 제거.
 * find_similar_cluster(코사인 유사도 ≥ threshold)로 기존 클러스터를 찾고,
 * 있으면 news_count 증가 후 그 클러스터 id를, 없으면 새 클러스터를 만들어 반환.
 *
 * (representative_news_id 갱신은 적재 단계 T-029에서 처리)
 */
export async function findOrCreateCluster(
  embedding: number[],
  threshold = 0.88,
): Promise<ClusterResult> {
  const vec = toVectorLiteral(embedding);

  const rows = await db.execute<{ cluster_id: string | null }>(sql`
    SELECT find_similar_cluster(${vec}::vector, ${threshold}) AS cluster_id
  `);
  const matched =
    (rows as unknown as { cluster_id: string | null }[])[0]?.cluster_id ?? null;

  if (matched) {
    await db
      .update(newsClusters)
      .set({ newsCount: sql`${newsClusters.newsCount} + 1` })
      .where(eq(newsClusters.id, matched));
    return { clusterId: matched, isNew: false };
  }

  const [created] = await db
    .insert(newsClusters)
    .values({ newsCount: 1 })
    .returning({ id: newsClusters.id });
  return { clusterId: created.id, isNew: true };
}

// ── 사전 필터링 휴리스틱 (LLM 호출 전 노이즈 거르기 = 비용 절감) ──────────

// 본문(스니펫) 최소 길이. 사양서는 200(전체 본문 기준)이나,
// 현재는 검색 API의 요약문을 쓰므로 너무 짧은 것만 거르도록 완화.
const MIN_BODY_LENGTH = 60;

const AD_KEYWORDS = [
  "이벤트",
  "프로모션",
  "할인",
  "쿠폰",
  "추첨",
  "출시 기념",
  "런칭 이벤트",
  "구매 시",
  "사은품",
];

const LOW_QUALITY_DOMAINS = ["example-spam.com"];

/**
 * LLM 분석을 건너뛸지 판단 (true = 건너뜀).
 * - 본문이 너무 짧음 / 광고성 제목 / 저품질 매체
 */
export function shouldSkipForLLM(
  news: Pick<
    CollectedNewsItem,
    "title_original" | "body_original" | "publisher_domain"
  >,
): boolean {
  if (!news.body_original || news.body_original.length < MIN_BODY_LENGTH) {
    return true;
  }
  if (AD_KEYWORDS.some((kw) => news.title_original.includes(kw))) {
    return true;
  }
  if (LOW_QUALITY_DOMAINS.includes(news.publisher_domain ?? "")) {
    return true;
  }
  return false;
}
