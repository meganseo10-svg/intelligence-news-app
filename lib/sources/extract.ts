/**
 * 기사 URL에서 본문 텍스트를 추출 (경량 버전, jsdom 없이).
 * 실패하면 null — 호출부에서 검색 스니펫으로 폴백.
 */
export async function extractArticleText(
  url: string,
  maxChars = 3000,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; IntelDailyBot/1.0; +https://intelligence-news-app.vercel.app)",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ");

    // <p> 단락 텍스트 수집
    const paragraphs = [...cleaned.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
      .map((m) =>
        m[1]
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim(),
      )
      .filter((t) => t.length > 40);

    let text = paragraphs.join("\n");

    // 본문이 빈약하면 메타 설명으로 보강
    if (text.length < 200) {
      const og = cleaned.match(
        /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
      )?.[1];
      const md = cleaned.match(
        /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
      )?.[1];
      text = [og, md, text].filter(Boolean).join("\n").trim();
    }

    return text.slice(0, maxChars).trim() || null;
  } catch {
    return null;
  }
}
