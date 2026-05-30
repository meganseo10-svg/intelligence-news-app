import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/** 로그인해야만 접근 가능한 경로들 */
const PROTECTED_PREFIXES = [
  "/feed",
  "/saved",
  "/settings",
  "/onboarding",
  "/admin",
];

/**
 * 매 요청마다 Supabase 세션 쿠키를 갱신하고,
 * 비로그인 사용자가 보호 경로에 접근하면 /login 으로 리다이렉트한다.
 *
 * 미들웨어는 Edge 런타임에서 돌기 때문에 공개 환경변수(process.env.NEXT_PUBLIC_*)만 직접 사용한다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // ⚠️ createServerClient 와 getUser() 사이에 다른 로직을 넣지 말 것.
  // 작은 실수로 세션이 무작위로 끊길 수 있다 (Supabase 공식 주의사항).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix),
  );

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
