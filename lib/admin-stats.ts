import { sql } from "drizzle-orm";
import { db } from "@/db";

export interface DailyStat {
  day: string;
  cost: number;
  calls: number;
}

export interface AdminStats {
  usersTotal: number;
  usersActive: number;
  feedItemsToday: number;
  costTodayUsd: number;
  costMonthUsd: number;
  errorsToday: number;
  series: DailyStat[];
}

function first<T>(rows: unknown): T {
  return (rows as T[])[0];
}

export async function getAdminStats(): Promise<AdminStats> {
  const users = first<{ total: number; active: number }>(
    await db.execute(sql`
      select count(*)::int as total,
             count(*) filter (where onboarding_completed)::int as active
      from user_profiles
    `),
  );

  const feed = first<{ c: number }>(
    await db.execute(sql`
      select count(*)::int as c from user_news_feed where feed_date = current_date
    `),
  );

  const today = first<{ cost: number; errors: number }>(
    await db.execute(sql`
      select coalesce(sum(cost_usd), 0)::float as cost,
             count(*) filter (where status = 'error')::int as errors
      from api_usage_log
      where created_at >= date_trunc('day', now())
    `),
  );

  const month = first<{ cost: number }>(
    await db.execute(sql`
      select coalesce(sum(cost_usd), 0)::float as cost
      from api_usage_log
      where created_at >= date_trunc('month', now())
    `),
  );

  const series = (await db.execute(sql`
    select to_char(date_trunc('day', created_at), 'MM-DD') as day,
           coalesce(sum(cost_usd), 0)::float as cost,
           count(*)::int as calls
    from api_usage_log
    where created_at >= now() - interval '7 days'
    group by 1
    order by 1
  `)) as unknown as DailyStat[];

  return {
    usersTotal: users.total,
    usersActive: users.active,
    feedItemsToday: feed.c,
    costTodayUsd: today.cost,
    costMonthUsd: month.cost,
    errorsToday: today.errors,
    series: series.map((s) => ({ day: s.day, cost: s.cost, calls: s.calls })),
  };
}
