import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

/** news_clusters — 의미적으로 같은 사건을 묶은 클러스터 */
export const newsClusters = pgTable("news_clusters", {
  id: uuid("id").primaryKey().defaultRandom(),
  topicSummary: text("topic_summary"),
  representativeNewsId: uuid("representative_news_id"),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow(),
  newsCount: integer("news_count").default(1),
});

/** news_items — 수집된 개별 뉴스. embedding 은 pgvector(1536). */
export const newsItems = pgTable("news_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  urlCanonical: text("url_canonical").notNull().unique(),
  publisher: text("publisher"),
  publisherDomain: text("publisher_domain"),
  originalLang: text("original_lang").notNull(),
  titleOriginal: text("title_original").notNull(),
  bodyOriginal: text("body_original"),
  thumbnailUrl: text("thumbnail_url"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  collectedAt: timestamp("collected_at", { withTimezone: true }).defaultNow(),
  source: text("source").notNull(), // 'naver' | 'gnews' | 'rss' | 'manual'
  clusterId: uuid("cluster_id").references(() => newsClusters.id),
  embedding: vector("embedding", { dimensions: 1536 }),
});

/** translations — 뉴스 번역 글로벌 캐시 (전체 사용자 공유) */
export const translations = pgTable("translations", {
  id: uuid("id").primaryKey().defaultRandom(),
  newsId: uuid("news_id")
    .notNull()
    .references(() => newsItems.id, { onDelete: "cascade" }),
  targetLang: text("target_lang").notNull(),
  titleTranslated: text("title_translated").notNull(),
  summaryTranslated: text("summary_translated").notNull(),
  bodyTranslated: text("body_translated"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
