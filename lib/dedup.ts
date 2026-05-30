import { eq, sql } from "drizzle-orm";
import { db, newsClusters } from "@/db";

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
