import {
  pgTable,
  uuid,
  text,
  doublePrecision,
  boolean,
  timestamp,
  date,
} from "drizzle-orm/pg-core";
import { newsItems } from "./news";
import { keywords } from "./keywords";

/** insights — 사용자별 "내 회사 관점" 시사점 분석 결과 */
export const insights = pgTable("insights", {
  id: uuid("id").primaryKey().defaultRandom(),
  newsId: uuid("news_id")
    .notNull()
    .references(() => newsItems.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(),
  category: text("category"),
  relevanceScore: doublePrecision("relevance_score"),
  importanceScore: doublePrecision("importance_score"),
  salesOpportunity: text("sales_opportunity"),
  targetCustomer: text("target_customer"),
  riskSignal: text("risk_signal"),
  tags: text("tags").array(),
  recommendedAction: text("recommended_action"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** user_news_feed — 사용자별·일자별 피드 인덱스 */
export const userNewsFeed = pgTable("user_news_feed", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  newsId: uuid("news_id")
    .notNull()
    .references(() => newsItems.id, { onDelete: "cascade" }),
  keywordId: uuid("keyword_id").references(() => keywords.id, {
    onDelete: "set null",
  }),
  feedDate: date("feed_date").notNull(),
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** saved_news — 북마크 + 메모 */
export const savedNews = pgTable("saved_news", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  newsId: uuid("news_id")
    .notNull()
    .references(() => newsItems.id, { onDelete: "cascade" }),
  userNote: text("user_note"),
  savedAt: timestamp("saved_at", { withTimezone: true }).defaultNow(),
});
