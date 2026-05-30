import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트 / 서버 액션 / 라우트 핸들러에서 사용하는 Supabase 클라이언트.
 * 요청별 쿠키에서 로그인 세션을 읽어 들인다.
 *
 * 공개 키(NEXT_PUBLIC_*)만 사용하므로 process.env에서 직접 읽는다
 * (Supabase 공식 Next.js 가이드 패턴).
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 쿠키 set이 막힌다.
            // 세션 갱신은 middleware가 담당하므로 여기선 무시해도 안전.
          }
        },
      },
    },
  );
}
