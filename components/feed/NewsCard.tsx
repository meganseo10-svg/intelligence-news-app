"use client";

import { useState } from "react";
import {
  Bookmark,
  Copy,
  ExternalLink,
  Languages,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_LABEL: Record<string, string> = {
  competitor: "경쟁사",
  industry: "업계 동향",
  product: "제품·기술",
  general: "일반",
};

export interface FeedItem {
  feedId: string;
  news: {
    id: string;
    url: string;
    publisher: string | null;
    publisherDomain: string | null;
    originalLang: string;
    titleOriginal: string;
    bodyOriginal: string | null;
    publishedAt: string | null;
  };
  titleTranslated: string | null;
  summaryTranslated: string | null;
  groupCategory: string | null;
  insight: {
    category: string | null;
    importanceScore: number | null;
    salesOpportunity: string | null;
    targetCustomer: string | null;
    riskSignal: string | null;
    tags: string[] | null;
  } | null;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "방금";
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export function NewsCard({ item }: { item: FeedItem }) {
  const { news, insight } = item;
  const hasTranslation = !!item.titleTranslated && news.originalLang !== "ko";
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  const title =
    showOriginal || !item.titleTranslated
      ? news.titleOriginal
      : item.titleTranslated;
  const summary =
    (showOriginal ? news.bodyOriginal : item.summaryTranslated) ??
    item.summaryTranslated ??
    news.bodyOriginal ??
    "";

  async function copy() {
    const text = [
      item.titleTranslated ?? news.titleOriginal,
      "",
      item.summaryTranslated ?? "",
      insight?.salesOpportunity
        ? `\n💡 시사점: ${insight.salesOpportunity}`
        : "",
      `\n원문: ${news.url}`,
      `${news.publisher ?? ""}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  }

  return (
    <article className="rounded-xl border bg-background p-4">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {insight && (insight.importanceScore ?? 0) >= 0.8 && (
          <Badge variant="destructive">중요</Badge>
        )}
        {item.groupCategory ? (
          <Badge variant="secondary">
            {CATEGORY_LABEL[item.groupCategory] ?? item.groupCategory}
          </Badge>
        ) : insight?.category ? (
          <Badge variant="secondary">{insight.category}</Badge>
        ) : null}
        <span className="text-xs text-muted-foreground">
          {news.publisher} · {relativeTime(news.publishedAt)}
        </span>
        {hasTranslation && (
          <Badge variant="outline" className="ml-auto">
            <Languages className="mr-1 h-3 w-3" />
            {news.originalLang.toUpperCase()}→KO
          </Badge>
        )}
      </div>

      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        className="group"
      >
        <h3 className="mb-1.5 text-base font-medium leading-snug group-hover:underline">
          {title}
        </h3>
      </a>
      {summary && (
        <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
          {summary}
        </p>
      )}

      {insight?.salesOpportunity && (
        <div className="mb-3 rounded-lg bg-muted p-3">
          <div className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Lightbulb className="h-3 w-3" />내 비즈니스 시사점
          </div>
          <div className="text-sm leading-relaxed">
            <span className="text-muted-foreground">영업 기회:</span>{" "}
            {insight.salesOpportunity}
          </div>
          {insight.targetCustomer && (
            <div className="mt-1 text-sm leading-relaxed">
              <span className="text-muted-foreground">타겟:</span>{" "}
              {insight.targetCustomer}
            </div>
          )}
          {insight.riskSignal && (
            <div className="mt-1 text-sm leading-relaxed">
              <span className="text-muted-foreground">리스크:</span>{" "}
              {insight.riskSignal}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <a
          href={news.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center hover:text-foreground"
        >
          <ExternalLink className="mr-1 h-3.5 w-3.5" />
          원문
        </a>
        {hasTranslation && (
          <button
            onClick={() => setShowOriginal((v) => !v)}
            className="inline-flex items-center hover:text-foreground"
          >
            <Languages className="mr-1 h-3.5 w-3.5" />
            {showOriginal ? "번역 보기" : "원문 보기"}
          </button>
        )}
        <button
          onClick={copy}
          className="inline-flex items-center hover:text-foreground"
        >
          <Copy className="mr-1 h-3.5 w-3.5" />
          {copied ? "복사됨!" : "복사"}
        </button>
        <span className="ml-auto inline-flex items-center text-muted-foreground/50">
          <Bookmark className="mr-1 h-3.5 w-3.5" />
          저장(준비중)
        </span>
      </div>
    </article>
  );
}
