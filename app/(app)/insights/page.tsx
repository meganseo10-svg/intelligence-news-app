import { createClient } from "@/lib/supabase/server";
import { getInsightsSummary } from "@/lib/insights-summary";
import { BackButton } from "@/components/BackButton";

function Bar({
  label,
  count,
  max,
}: {
  label: string;
  count: number;
  max: number;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-sm">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded bg-muted">
        <div
          className="h-full rounded bg-primary"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-sm text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

export default async function InsightsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const s = await getInsightsSummary(user!.id, 7);
  const catMax = Math.max(1, ...s.byCategory.map((c) => c.count));
  const srcMax = Math.max(1, ...s.bySource.map((c) => c.count));
  const tagMax = Math.max(1, ...s.topTags.map((t) => t.count));

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <BackButton />
      <h1 className="text-xl font-medium">트렌드 인사이트</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        최근 {s.days}일 · 총 {s.total}건의 뉴스 흐름
      </p>

      {s.total === 0 ? (
        <div className="rounded-xl border bg-background p-8 text-center text-sm text-muted-foreground">
          아직 집계할 뉴스가 없어요. 수집이 쌓이면 트렌드가 보여요.
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border bg-background p-4">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              카테고리별 흐름
            </h2>
            <div className="space-y-2">
              {s.byCategory.map((c) => (
                <Bar
                  key={c.category}
                  label={c.category}
                  count={c.count}
                  max={catMax}
                />
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-background p-4">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              국내 / 해외
            </h2>
            <div className="space-y-2">
              {s.bySource.map((c) => (
                <Bar
                  key={c.label}
                  label={c.label}
                  count={c.count}
                  max={srcMax}
                />
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-background p-4">
            <h2 className="mb-3 text-sm font-medium text-muted-foreground">
              자주 등장한 키워드
            </h2>
            {s.topTags.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                태그 데이터가 아직 없어요.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {s.topTags.map((t) => (
                  <span
                    key={t.tag}
                    className="rounded-full bg-secondary px-3 py-1 text-sm"
                    style={{
                      fontSize: `${0.8 + (t.count / tagMax) * 0.5}rem`,
                    }}
                  >
                    {t.tag}{" "}
                    <span className="text-muted-foreground">{t.count}</span>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
