import {
  pgTable,
  uuid,
  text,
  integer,
  numeric,
  timestamp,
} from "drizzle-orm/pg-core";

/** api_usage_log — 외부 API/LLM 호출량·비용 운영 로그 */
export const apiUsageLog = pgTable("api_usage_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: text("source").notNull(),
  userId: uuid("user_id"),
  requestCount: integer("request_count").default(1),
  tokenInput: integer("token_input"),
  tokenOutput: integer("token_output"),
  costUsd: numeric("cost_usd", { precision: 10, scale: 6 }),
  status: text("status"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});
