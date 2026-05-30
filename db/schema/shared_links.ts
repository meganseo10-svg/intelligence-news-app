import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

/** shared_links — 공개 공유 링크 (token + 만료) */
export const sharedLinks = pgTable("shared_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  token: text("token").notNull().unique(),
  scope: text("scope").notNull(), // 'single_news' | 'daily_digest'
  resourceId: uuid("resource_id"),
  resourceData: jsonb("resource_data"),
  includeInsights: boolean("include_insights").default(true),
  userNote: text("user_note"),
  viewCount: integer("view_count").default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
