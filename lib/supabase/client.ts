import { createBrowserClient } from "@supabase/ssr";

/**
 * 클라이언트 컴포넌트(브라우저)에서 사용하는 Supabase 클라이언트.
 * 공개 키만 사용한다 (NEXT_PUBLIC_* 는 브라우저 번들에 안전하게 포함됨).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
