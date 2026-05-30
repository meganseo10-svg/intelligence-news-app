import {
  pgTable,
  uuid,
  text,
  time,
  integer,
  doublePrecision,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

/** notification_settings — 사용자별 알림 주기·시각·옵션 */
export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique(),
  frequency: text("frequency").notNull().default("daily"), // 'daily' | 'weekly' | 'urgent_only'
  sendTime: time("send_time").notNull().default("08:30:00"),
  daysOfWeek: integer("days_of_week").array().default([1, 2, 3, 4, 5]),
  urgentThreshold: doublePrecision("urgent_threshold").default(0.8),
  autoTranslate: boolean("auto_translate").default(true),
  showOriginalFirst: boolean("show_original_first").default(false),
  groupClusters: boolean("group_clusters").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/** delivery_channels — 사용자가 연결한 발송 채널 (email/slack/discord/kakao) */
export const deliveryChannels = pgTable("delivery_channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  channelType: text("channel_type").notNull(),
  config: jsonb("config").notNull(),
  isActive: boolean("is_active").default(true),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
