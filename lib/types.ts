export type NewsSource = "naver" | "gnews" | "rss" | "manual";

/** DB에 적재된 뉴스 (05_API_SPEC.md 11절) */
export interface NewsItem {
  id: string;
  url: string;
  url_canonical: string;
  publisher: string;
  publisher_domain: string | null;
  original_lang: string;
  title_original: string;
  body_original: string | null;
  thumbnail_url: string | null;
  published_at: string;
  collected_at: string;
  source: NewsSource;
  cluster_id: string | null;
}

/**
 * 수집기(어댑터)가 만들어내는 뉴스. DB 적재 전이라 id/collected_at/cluster_id 는 없다.
 */
export type CollectedNewsItem = Omit<
  NewsItem,
  "id" | "collected_at" | "cluster_id"
>;

export interface Insight {
  id: string;
  news_id: string;
  user_id: string;
  category: string;
  relevance_score: number;
  importance_score: number;
  sales_opportunity: string;
  target_customer: string;
  risk_signal: string;
  tags: string[];
  recommended_action: string;
}

export interface Translation {
  news_id: string;
  target_lang: string;
  title_translated: string;
  summary_translated: string;
  body_translated: string | null;
}

export type DeliveryChannelType = "email" | "slack" | "discord" | "kakao";

export interface DeliveryChannelConfig {
  email?: { email: string };
  slack?: { webhook_url: string; channel_name?: string };
  discord?: { webhook_url: string };
}

export type NotificationFrequency = "daily" | "weekly" | "urgent_only";
