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
