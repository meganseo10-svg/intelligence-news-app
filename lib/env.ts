import { z } from "zod";

/**
 * 빈 문자열("")을 undefined로 바꿔주는 헬퍼.
 * .env.local에 `OPENAI_API_KEY=` 처럼 비워두면 ""로 읽히는데,
 * 아직 발급 전인 선택 키는 undefined로 취급해 검증을 통과시킨다.
 */
const optionalString = () =>
  z.preprocess((v) => (v === "" ? undefined : v), z.string().min(1).optional());

const envSchema = z.object({
  // ── Supabase (1주차 필수) ──────────────────────────────
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1).startsWith("postgres"),

  // ── LLM ────────────────────────────────────────────────
  ANTHROPIC_API_KEY: z.string().min(1), // 1주차 필수
  OPENAI_API_KEY: optionalString(), // 2주차에 필수로 전환

  // ── News Sources (2주차) ───────────────────────────────
  NAVER_CLIENT_ID: optionalString(),
  NAVER_CLIENT_SECRET: optionalString(),
  GNEWS_API_KEY: optionalString(),

  // ── Email (3주차) ──────────────────────────────────────
  RESEND_API_KEY: optionalString(),
  RESEND_FROM_EMAIL: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.string().email().optional(),
  ),

  // ── Cron 보안 (1주차 필수) ─────────────────────────────
  CRON_SECRET: z.string().min(32, "CRON_SECRET은 32자 이상이어야 합니다."),

  // ── App ────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // ── Monitoring (선택) ──────────────────────────────────
  SENTRY_DSN: optionalString(),
  NEXT_PUBLIC_SENTRY_DSN: optionalString(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "❌ 환경변수가 올바르지 않습니다. .env.local 파일을 확인하세요:\n",
    parsed.error.flatten().fieldErrors,
  );
  throw new Error("환경변수 검증 실패 (lib/env.ts 참고)");
}

/**
 * 타입 안전한 환경변수 객체.
 * ⚠️ 서버 사이드에서만 사용하세요 (service_role 등 시크릿 포함).
 */
export const env = parsed.data;
