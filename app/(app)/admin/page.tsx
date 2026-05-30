import { createClient } from "@/lib/supabase/server";
import { getAdminStats } from "@/lib/admin-stats";
import { CostChart } from "@/components/admin/CostChart";
import { BackButton } from "@/components/BackButton";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-medium">{value}</div>
    </div>
  );
}

export default async function AdminPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isAdmin = !!user?.email && admins.includes(user.email);

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 text-center text-sm text-muted-foreground">
        관리자만 접근할 수 있어요.
      </main>
    );
  }

  const stats = await getAdminStats();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <BackButton />
      <h1 className="mb-4 text-xl font-medium">운영 대시보드</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard
          label="활성 사용자"
          value={`${stats.usersActive}/${stats.usersTotal}`}
        />
        <StatCard label="오늘 피드 적재" value={`${stats.feedItemsToday}건`} />
        <StatCard
          label="오늘 비용"
          value={`$${stats.costTodayUsd.toFixed(4)}`}
        />
        <StatCard
          label="이번 달 비용"
          value={`$${stats.costMonthUsd.toFixed(4)}`}
        />
        <StatCard label="오늘 에러" value={`${stats.errorsToday}건`} />
      </div>

      <div className="mt-6 rounded-xl border bg-background p-4">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          최근 7일 API 호출
        </h2>
        {stats.series.length === 0 ? (
          <p className="text-sm text-muted-foreground">데이터가 없어요.</p>
        ) : (
          <CostChart data={stats.series} />
        )}
      </div>
    </main>
  );
}
