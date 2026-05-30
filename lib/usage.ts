import { sql } from "drizzle-orm";
import { db, apiUsageLog } from "@/db";

/** 오늘(UTC 기준) 특정 소스의 요청 합계 — 무료 한도 관리용 */
export async function getTodayUsageCount(source: string): Promise<number> {
  const rows = await db.execute<{ total: number }>(sql`
    select coalesce(sum(request_count), 0)::int as total
    from api_usage_log
    where source = ${source}
      and created_at >= date_trunc('day', now())
  `);
  const list = rows as unknown as { total: number }[];
  return list[0]?.total ?? 0;
}

export interface ApiUsageEntry {
  source: string;
  userId?: string | null;
  requestCount?: number;
  tokenInput?: number;
  tokenOutput?: number;
  costUsd?: number;
  status?: string;
  errorMessage?: string;
}

/** api_usage_log 에 호출 1건 기록 */
export async function logApiUsage(entry: ApiUsageEntry): Promise<void> {
  await db.insert(apiUsageLog).values({
    source: entry.source,
    userId: entry.userId ?? null,
    requestCount: entry.requestCount ?? 1,
    tokenInput: entry.tokenInput,
    tokenOutput: entry.tokenOutput,
    costUsd: entry.costUsd != null ? String(entry.costUsd) : null,
    status: entry.status,
    errorMessage: entry.errorMessage,
  });
}
