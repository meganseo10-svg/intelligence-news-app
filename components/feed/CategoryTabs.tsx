"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { key: "all", label: "전체" },
  { key: "competitor", label: "경쟁사" },
  { key: "industry", label: "업계 동향" },
  { key: "product", label: "제품·기술" },
  { key: "general", label: "일반" },
];

export function CategoryTabs({
  counts,
  date,
}: {
  counts: Record<string, number>;
  date: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const active = sp.get("category") ?? "all";
  const [q, setQ] = useState(sp.get("q") ?? "");

  function navigate(patch: Record<string, string | undefined>) {
    const next = new URLSearchParams(sp.toString());
    next.set("date", date);
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.push(`${pathname}?${next.toString()}`);
  }

  return (
    <div className="mb-4 space-y-2">
      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map((t) => {
          const count = t.key === "all" ? counts.all : (counts[t.key] ?? 0);
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() =>
                navigate({ category: t.key === "all" ? undefined : t.key })
              }
              className={`shrink-0 rounded-full border px-3 py-1 text-sm transition-colors ${
                isActive
                  ? "border-foreground bg-background font-medium"
                  : "border-transparent bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label} {count}
            </button>
          );
        })}
      </div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") navigate({ q: q.trim() || undefined });
        }}
        placeholder="제목 검색 후 Enter"
        className="w-full rounded-md border bg-background px-3 py-1.5 text-sm"
      />
    </div>
  );
}
