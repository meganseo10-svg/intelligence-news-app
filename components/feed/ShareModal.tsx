"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ShareTarget {
  id: string;
  title: string;
  url: string;
  summary: string;
  salesOpportunity: string | null;
}

const EXPIRY = [
  { v: "24h", l: "24시간" },
  { v: "7d", l: "7일" },
  { v: "30d", l: "30일" },
  { v: "never", l: "무기한" },
];

export function ShareModal({
  open,
  onOpenChange,
  target,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: ShareTarget;
}) {
  const [includeInsights, setIncludeInsights] = useState(true);
  const [expiry, setExpiry] = useState("7d");
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");

  const shareText = [
    target.title,
    "",
    target.summary,
    target.salesOpportunity ? `\n💡 시사점: ${target.salesOpportunity}` : "",
    `\n원문: ${target.url}`,
  ].join("\n");
  const mailto = `mailto:?subject=${encodeURIComponent(target.title)}&body=${encodeURIComponent(shareText)}`;

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  }

  async function createLink() {
    setLoading(true);
    try {
      const res = await fetch("/api/shared-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: "single_news",
          resource_id: target.id,
          include_insights: includeInsights,
          expires_in: expiry,
        }),
      });
      const j = await res.json();
      if (res.ok) setLink(j.url);
    } finally {
      setLoading(false);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({
        title: target.title,
        text: target.summary,
        url: link ?? target.url,
      });
    } else {
      copy(link ?? target.url, "native");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>공유</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {target.title}
          </p>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInsights}
              onChange={(e) => setIncludeInsights(e.target.checked)}
              className="h-4 w-4"
            />
            비즈니스 시사점 포함
          </label>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copy(shareText, "text")}
            >
              {copied === "text" ? "복사됨!" : "본문 복사"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={mailto}>메일</a>
            </Button>
            <Button variant="outline" size="sm" onClick={nativeShare}>
              기기 공유
            </Button>
          </div>

          <div className="rounded-lg border p-3">
            <div className="mb-2 text-xs font-medium text-muted-foreground">
              공개 링크
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
              {EXPIRY.map((e) => (
                <button
                  key={e.v}
                  onClick={() => setExpiry(e.v)}
                  className={`rounded-md border px-2 py-1 text-xs ${
                    expiry === e.v
                      ? "border-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {e.l}
                </button>
              ))}
            </div>
            {link ? (
              <div className="flex gap-2">
                <input
                  readOnly
                  value={link}
                  className="flex-1 rounded-md border bg-muted px-2 py-1 text-xs"
                />
                <Button size="sm" onClick={() => copy(link, "link")}>
                  {copied === "link" ? "복사됨!" : "복사"}
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={createLink} disabled={loading}>
                {loading ? "생성 중…" : "공개 링크 생성"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
