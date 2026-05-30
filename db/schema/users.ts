import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";

/**
 * user_profiles — Supabase auth.users 와 1:1로 연결되는 프로필.
 * (user_id 는 auth.users.id 를 참조하지만 auth 스키마는 Drizzle로 모델링하지 않으므로
 *  여기서는 FK 선언 없이 uuid PK로만 둔다. 실제 FK/트리거는 SQL 마이그레이션에 존재.)
 */
export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey(),
  company: text("company"),
  industry: text("industry"),
  companySize: text("company_size"),
  products: text("products").array().default([]),
  targetCustomers: text("target_customers").array().default([]),
  timezone: text("timezone").default("Asia/Seoul"),
  preferredLang: text("preferred_lang").default("ko"),
  // 시사점 생성 기준
  trendFocus: text("trend_focus"),
  strengths: text("strengths"),
  weaknesses: text("weaknesses"),
  salesFocus: text("sales_focus"),
  threats: text("threats"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
