"use client";

import { useState } from "react";
import { Link2, Share2 } from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  const shareText = target.summary
    ? `${target.title}\n\n${target.summary}`
    : target.title;

  async function ensureLink(): Promise<string> {
    if (link) return link;
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
      if (res.ok && j.url) {
        setLink(j.url);
        return j.url;
      }
    } finally {
      setLoading(false);
    }
    return target.url;
  }

  async function shareTo(kind: "native" | "facebook" | "x" | "copy") {
    const url = await ensureLink();
    if (kind === "copy") {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      return;
    }
    if (kind === "native") {
      if (navigator.share) {
        await navigator
          .share({ title: target.title, text: shareText, url })
          .catch(() => {});
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
      return;
    }
    const enc = encodeURIComponent(url);
    const sns =
      kind === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${enc}`
        : `https://twitter.com/intent/tweet?url=${enc}&text=${encodeURIComponent(target.title)}`;
    window.open(sns, "_blank", "noopener,noreferrer,width=600,height=500");
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

          <div className="flex flex-wrap gap-1">
            <span className="mr-1 self-center text-xs text-muted-foreground">
              링크 유효기간
            </span>
            {EXPIRY.map((e) => (
              <button
                key={e.v}
                onClick={() => setExpiry(e.v)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  expiry === e.v ? "border-foreground" : "text-muted-foreground"
                }`}
              >
                {e.l}
              </button>
            ))}
          </div>

          {/* SNS 공유 */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => shareTo("native")}
              disabled={loading}
              className="w-full"
            >
              <Share2 className="mr-2 h-4 w-4" />
              {loading ? "준비 중…" : "공유하기"}
            </Button>
            <Button
              variant="outline"
              onClick={() => shareTo("copy")}
              disabled={loading}
            >
              <Link2 className="mr-2 h-4 w-4" />
              {copied ? "복사됨!" : "링크 복사"}
            </Button>
            <Button variant="outline" onClick={() => shareTo("facebook")}>
              페이스북
            </Button>
            <Button variant="outline" onClick={() => shareTo("x")}>
              X (트위터)
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            📱 모바일에서 <b>공유하기</b>를 누르면 카카오톡·인스타그램·틱톡 등
            설치된 앱으로 바로 공유돼요. 공유 링크는 로그인 없이 누구나 열 수
            있어요.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
