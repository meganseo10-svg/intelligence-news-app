"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export interface NotificationSettingsValue {
  frequency: "daily" | "weekly" | "urgent_only";
  send_time: string; // "HH:MM" or "HH:MM:SS"
  days_of_week: number[];
  auto_translate: boolean;
  show_original_first: boolean;
  group_clusters: boolean;
}

const FREQUENCIES = [
  { key: "daily", label: "데일리", desc: "매일 지정 시각에 한 번" },
  { key: "weekly", label: "위클리", desc: "선택한 요일에" },
  { key: "urgent_only", label: "긴급만", desc: "중요도 높은 뉴스만" },
] as const;

const TIME_PRESETS = ["07:00", "08:30", "12:00", "18:00"];
const DAYS = [
  { n: 1, l: "월" },
  { n: 2, l: "화" },
  { n: 3, l: "수" },
  { n: 4, l: "목" },
  { n: 5, l: "금" },
  { n: 6, l: "토" },
  { n: 0, l: "일" },
];

function Toggle({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <button
        type="button"
        onClick={onClick}
        className={`h-6 w-11 rounded-full transition-colors ${on ? "bg-primary" : "bg-muted"}`}
      >
        <span
          className={`block h-5 w-5 rounded-full bg-background shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

export function NotificationSettings({
  initial,
}: {
  initial: NotificationSettingsValue;
}) {
  const [v, setV] = useState<NotificationSettingsValue>({
    ...initial,
    send_time: initial.send_time.slice(0, 5),
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof NotificationSettingsValue>(
    key: K,
    val: NotificationSettingsValue[K],
  ) {
    setV((prev) => ({ ...prev, [key]: val }));
  }

  function toggleDay(n: number) {
    set(
      "days_of_week",
      v.days_of_week.includes(n)
        ? v.days_of_week.filter((d) => d !== n)
        : [...v.days_of_week, n].sort(),
    );
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v),
      });
      setMsg(res.ok ? "저장됐어요." : "저장에 실패했어요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          알림 주기
        </h2>
        <div className="space-y-2">
          {FREQUENCIES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => set("frequency", f.key)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${
                v.frequency === f.key ? "border-foreground" : ""
              }`}
            >
              <span className="text-sm font-medium">{f.label}</span>
              <span className="text-xs text-muted-foreground">{f.desc}</span>
            </button>
          ))}
        </div>
      </section>

      {v.frequency === "weekly" && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">
            수신 요일
          </h2>
          <div className="flex gap-1">
            {DAYS.map((d) => (
              <button
                key={d.n}
                type="button"
                onClick={() => toggleDay(d.n)}
                className={`h-9 w-9 rounded-full border text-sm ${
                  v.days_of_week.includes(d.n)
                    ? "border-foreground bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {d.l}
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-medium text-muted-foreground">
          수신 시각
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {TIME_PRESETS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("send_time", t)}
              className={`rounded-md border px-3 py-1 text-sm ${
                v.send_time === t
                  ? "border-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
          <input
            type="time"
            value={v.send_time}
            onChange={(e) => set("send_time", e.target.value)}
            className="rounded-md border bg-background px-2 py-1 text-sm"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">타임존: Asia/Seoul</p>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-medium text-muted-foreground">
          표시 옵션
        </h2>
        <Toggle
          label="해외 뉴스 자동 번역"
          on={v.auto_translate}
          onClick={() => set("auto_translate", !v.auto_translate)}
        />
        <Toggle
          label="원문 우선 표시"
          on={v.show_original_first}
          onClick={() => set("show_original_first", !v.show_original_first)}
        />
        <Toggle
          label="중복 사건 묶기"
          on={v.group_clusters}
          onClick={() => set("group_clusters", !v.group_clusters)}
        />
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={save} disabled={saving}>
          {saving ? "저장 중…" : "저장"}
        </Button>
        {msg && <span className="text-sm text-muted-foreground">{msg}</span>}
      </div>
    </div>
  );
}
