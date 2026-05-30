import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

/**
 * Supabase Transaction pooler(6543)를 사용하므로 prepared statement를 끈다(prepare: false).
 * 서버리스(Vercel) 환경을 고려해 연결 수도 작게 유지한다.
 */
const client = postgres(env.DATABASE_URL, {
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });

// 스키마(테이블 객체)도 db 모듈에서 바로 가져다 쓸 수 있게 재노출
export * from "./schema";
