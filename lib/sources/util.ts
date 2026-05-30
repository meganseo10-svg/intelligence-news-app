/** URL에서 호스트명 추출 (www. 제거) */
export function hostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** 쿼리/해시/트레일링 슬래시 제거한 기본 canonical URL (T-021에서 고도화) */
export function canonical(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    return u.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}
