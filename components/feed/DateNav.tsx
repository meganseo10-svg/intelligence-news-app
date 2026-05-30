"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function DateNav({ date, today }: { date: string; today: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function go(d: string) {
    const next = new URLSearchParams(sp.toString());
    next.set("date", d);
    router.push(`${pathname}?${next.toString()}`);
  }

  function shift(days: number) {
    const dt = new Date(date + "T00:00:00Z");
    dt.setUTCDate(dt.getUTCDate() + days);
    go(dt.toISOString().slice(0, 10));
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => shift(-1)}
        className="rounded-md border px-2 py-1 text-muted-foreground hover:bg-muted"
        aria-label="이전 날"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <input
        type="date"
        value={date}
        max={today}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="rounded-md border bg-background px-2 py-1 text-sm"
      />
      <button
        onClick={() => shift(1)}
        disabled={date >= today}
        className="rounded-md border px-2 py-1 text-muted-foreground hover:bg-muted disabled:opacity-40"
        aria-label="다음 날"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
