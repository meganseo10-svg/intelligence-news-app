"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TagInput } from "@/components/onboarding/TagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDUSTRIES = [
  "B2B SaaS",
  "제조",
  "금융",
  "커머스·리테일",
  "의료·헬스케어",
  "교육",
  "미디어·콘텐츠",
  "건설·부동산",
  "기타",
];
const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

export interface ProfileEditorValue {
  displayName: string;
  company: string;
  industry: string;
  company_size: string;
  products: string[];
  target_customers: string[];
  trend_focus: string;
  strengths: string;
  weaknesses: string;
  sales_focus: string;
  threats: string;
}

export function ProfileEditor({ initial }: { initial: ProfileEditorValue }) {
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof ProfileEditorValue>(
    k: K,
    val: ProfileEditorValue[K],
  ) {
    setV((p) => ({ ...p, [k]: val }));
  }

  async function save() {
    setMsg(null);
    if (
      !v.company.trim() ||
      !v.industry ||
      !v.company_size ||
      v.products.length === 0
    ) {
      setMsg("회사명·업종·규모·제품은 필수예요.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.auth.updateUser({ data: { display_name: v.displayName } });
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: v.company,
          industry: v.industry,
          company_size: v.company_size,
          products: v.products,
          target_customers: v.target_customers,
          trend_focus: v.trend_focus,
          strengths: v.strengths,
          weaknesses: v.weaknesses,
          sales_focus: v.sales_focus,
          threats: v.threats,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          preferred_lang: "ko",
        }),
      });
      setMsg(res.ok ? "저장됐어요." : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">표시 이름</Label>
        <Input
          id="displayName"
          value={v.displayName}
          onChange={(e) => set("displayName", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="company">회사명</Label>
        <Input
          id="company"
          value={v.company}
          onChange={(e) => set("company", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>업종</Label>
          <Select
            value={v.industry}
            onValueChange={(val) => set("industry", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {INDUSTRIES.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>회사 규모</Label>
          <Select
            value={v.company_size}
            onValueChange={(val) => set("company_size", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_SIZES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}명
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>주력 제품·서비스</Label>
        <TagInput
          value={v.products}
          onChange={(t) => set("products", t)}
          placeholder="입력 후 Enter"
        />
      </div>
      <div className="space-y-1.5">
        <Label>
          타겟 고객 <span className="text-muted-foreground">(선택)</span>
        </Label>
        <TagInput
          value={v.target_customers}
          onChange={(t) => set("target_customers", t)}
          placeholder="입력 후 Enter"
        />
      </div>
      <div className="space-y-3 rounded-lg border p-3">
        <p className="text-sm font-medium">
          시사점 기준{" "}
          <span className="font-normal text-muted-foreground">
            (입력하면 AI가 이 관점으로 분석해요 · 선택)
          </span>
        </p>
        {(
          [
            [
              "trend_focus",
              "주목 트렌드·방향",
              "예: 제로트러스트, 온디바이스 AI 보안",
            ],
            [
              "strengths",
              "우리 회사 강점",
              "예: 공공·금융 레퍼런스, 빠른 도입",
            ],
            ["weaknesses", "약점", "예: 글로벌 인지도 부족"],
            ["sales_focus", "영업 기회 관점", "예: 규제 강화 시점에 제안 강화"],
            ["threats", "위협 요인", "예: 글로벌 경쟁사 국내 진출"],
          ] as const
        ).map(([key, label, ph]) => (
          <div key={key} className="space-y-1">
            <Label htmlFor={key} className="text-xs">
              {label}
            </Label>
            <textarea
              id={key}
              value={v[key]}
              onChange={(e) => set(key, e.target.value)}
              placeholder={ph}
              rows={2}
              className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Button onClick={save} disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
      <p className="text-xs text-muted-foreground">
        이 정보로 “우리 회사 관점”의 뉴스 시사점이 생성돼요. 자세할수록 분석이
        정확해집니다.
      </p>
    </div>
  );
}
