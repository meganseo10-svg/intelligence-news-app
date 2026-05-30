"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Newspaper, Package, Target, TrendingUp, Sparkles } from "lucide-react";
import { finishOnboarding } from "@/lib/actions/onboarding";
import { ProgressBar } from "./ProgressBar";
import { TagInput } from "./TagInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GROUPS = [
  {
    key: "competitor",
    label: "경쟁사",
    desc: "경쟁사 이름·제품",
    icon: Target,
  },
  {
    key: "industry",
    label: "업계 동향",
    desc: "시장·트렌드",
    icon: TrendingUp,
  },
  {
    key: "product",
    label: "제품·기술",
    desc: "내 제품/기술 분야",
    icon: Package,
  },
  { key: "general", label: "일반", desc: "관심 일반 주제", icon: Newspaper },
] as const;

const MAX_KEYWORDS = 30;

export function KeywordsForm() {
  const router = useRouter();
  const [byCat, setByCat] = useState<Record<string, string[]>>({
    competitor: [],
    industry: [],
    product: [],
    general: [],
  });
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = Object.values(byCat).reduce((sum, arr) => sum + arr.length, 0);

  function setGroup(key: string, terms: string[]) {
    setByCat((prev) => ({ ...prev, [key]: terms }));
  }

  async function handleSuggest() {
    setSuggesting(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch("/api/keywords/suggest", { method: "POST" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error?.message ?? "추천에 실패했어요.");
      }
      const { suggestions } = (await res.json()) as {
        suggestions: Record<string, string[]>;
      };
      setByCat((prev) => {
        const next = { ...prev };
        for (const key of ["competitor", "industry", "product", "general"]) {
          const merged = new Set(prev[key] ?? []);
          (suggestions[key] ?? []).forEach((t) => merged.add(t));
          next[key] = Array.from(merged);
        }
        return next;
      });
      setNote("AI가 추천 키워드를 채웠어요. 원하지 않는 건 X로 빼세요.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "추천에 실패했어요.");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleFinish() {
    if (total === 0) {
      setError("키워드를 최소 1개 이상 추가해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    const result = await finishOnboarding(
      GROUPS.map((g) => ({ category: g.key, terms: byCat[g.key] })),
    );
    if (!result.ok) {
      setError(result.error ?? "저장에 실패했어요. 다시 시도해주세요.");
      setSaving(false);
      return;
    }
    router.push("/feed");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <ProgressBar current={2} total={2} />
        <div>
          <CardTitle className="text-xl">관심 키워드 등록</CardTitle>
          <CardDescription>
            이 키워드로 매일 뉴스를 모아 분석해요. (전체 최대 {MAX_KEYWORDS}개)
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleSuggest}
          disabled={suggesting}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {suggesting ? "AI가 추천하는 중…" : "AI 추천 키워드"}
        </Button>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}

        {GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <div key={g.key} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{g.label}</span>
                <span className="text-xs text-muted-foreground">{g.desc}</span>
              </div>
              <TagInput
                value={byCat[g.key]}
                onChange={(terms) => setGroup(g.key, terms)}
                placeholder="키워드 입력 후 Enter"
                max={MAX_KEYWORDS}
              />
            </div>
          );
        })}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {total} / {MAX_KEYWORDS}개
          </span>
          <Button type="button" onClick={handleFinish} disabled={saving}>
            {saving ? "저장 중…" : "완료하고 시작하기"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
