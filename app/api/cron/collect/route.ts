import { NextResponse } from "next/server";
import { runCollectForAllUsers } from "@/lib/pipeline";
import { unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel 함수 타임아웃(초)

/**
 * 매일 새벽 수집 잡 (Vercel Cron이 GET으로 호출).
 * Authorization: Bearer ${CRON_SECRET} 검증.
 */
async function handle(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return unauthorized();
  }

  const startedAt = Date.now();
  const { users, stats } = await runCollectForAllUsers({ maxItemsPerUser: 8 });

  const totals = stats.reduce(
    (t, s) => ({
      collected: t.collected + s.collected,
      analyzed: t.analyzed + s.analyzed,
      feedItems: t.feedItems + s.feedItems,
    }),
    { collected: 0, analyzed: 0, feedItems: 0 },
  );

  return NextResponse.json({
    ok: true,
    duration_ms: Date.now() - startedAt,
    users_processed: users,
    totals,
    stats,
  });
}

export const GET = handle;
export const POST = handle;
