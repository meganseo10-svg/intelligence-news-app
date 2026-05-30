import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

/** keyword_groups — 키워드 그룹 (경쟁사/업계/제품/일반) */
export const keywordGroups = pgTable("keyword_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  category: text("category").notNull(), // 'competitor' | 'industry' | 'product' | 'general'
  name: text("name").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/** keywords — 그룹에 속한 개별 키워드 */
export const keywords = pgTable("keywords", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => keywordGroups.id, { onDelete: "cascade" }),
  term: text("term").notNull(),
  sources: jsonb("sources")
    .$type<string[]>()
    .default(["naver", "gnews", "rss"]),
  language: text("language").default("auto"), // 'ko' | 'en' | 'auto'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
