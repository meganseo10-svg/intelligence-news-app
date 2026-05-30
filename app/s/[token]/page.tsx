import type { Metadata } from "next";
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db, sharedLinks } from "@/db";

interface SharedData {
  news: {
    url: string;
    publisher: string | null;
    original_lang: string;
    title_original: string;
  };
  translation: {
    title_translated: string;
    summary_translated: string;
  } | null;
  insight: {
    category: string | null;
    sales_opportunity: string | null;
    target_customer: string | null;
    risk_signal: string | null;
  } | null;
  user_note: string | null;
  shared_by_name: string;
}

async function getLink(token: string) {
  const [row] = await db
    .select({
      data: sharedLinks.resourceData,
      expiresAt: sharedLinks.expiresAt,
    })
    .from(sharedLinks)
    .where(eq(sharedLinks.token, token))
    .limit(1);
  return row;
}

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const row = await getLink(params.token);
  const d = row?.data as SharedData | undefined;
  const title = d?.translation?.title_translated ?? d?.news.title_original;
  return {
    title: title ? `${title} · Intel Daily` : "Intel Daily 공유",
    description: d?.translation?.summary_translated ?? undefined,
    openGraph: {
      title: title ?? "Intel Daily",
      description: d?.translation?.summary_translated ?? undefined,
      type: "article",
    },
  };
}

export default async function SharedPage({
  params,
}: {
  params: { token: string };
}) {
  const row = await getLink(params.token);

  if (!row) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">존재하지 않는 링크예요.</p>
      </Centered>
    );
  }
  if (row.expiresAt && new Date(row.expiresAt) < new Date()) {
    return (
      <Centered>
        <p className="text-sm text-muted-foreground">만료된 링크예요.</p>
      </Centered>
    );
  }

  // 조회수 증가 (실패해도 무시)
  await db
    .update(sharedLinks)
    .set({ viewCount: sql`${sharedLinks.viewCount} + 1` })
    .where(eq(sharedLinks.token, params.token))
    .catch(() => {});

  const d = row.data as SharedData;
  const title = d.translation?.title_translated ?? d.news.title_original;
  const summary = d.translation?.summary_translated ?? "";

  return (
    <div className="min-h-dvh bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="rounded-xl border bg-background p-5">
          <p className="mb-2 text-xs text-muted-foreground">
            {d.news.publisher} · {d.shared_by_name}님이 공유
          </p>
          <a
            href={d.news.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-medium hover:underline"
          >
            {title}
          </a>
          {summary && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          )}

          {d.insight?.sales_opportunity && (
            <div className="mt-4 rounded-lg bg-muted p-3 text-sm">
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                💡 비즈니스 시사점
              </div>
              <div>영업 기회: {d.insight.sales_opportunity}</div>
              {d.insight.target_customer && (
                <div className="mt-1">타겟: {d.insight.target_customer}</div>
              )}
            </div>
          )}

          {d.user_note && (
            <p className="mt-3 rounded-lg border-l-2 border-foreground/30 bg-muted/50 px-3 py-2 text-sm">
              📝 {d.user_note}
            </p>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/signup"
            className="text-sm font-medium text-foreground underline"
          >
            Intel Daily에서 매일 받아보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/30 px-4">
      {children}
    </div>
  );
}
