# 💻 REFERENCE CODE — 첫 5개 티켓 참고 코드

> Claude Code가 막혔거나 결과물이 이상할 때, 이 파일과 비교해서 수정할 수 있습니다.
> 모든 코드는 그대로 복붙해도 동작하지만, Claude Code에게 맡기는 게 1순위입니다.

---

## T-001: 프로젝트 스캐폴드

### 1. Next.js 프로젝트 생성

```bash
# 현재 폴더에 설치 (사양서 파일들이 있는 폴더)
pnpm create next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --use-pnpm
```

### 2. shadcn/ui 초기화

```bash
pnpm dlx shadcn@latest init
```

설정 답변:
- TypeScript: Yes
- Style: Default
- Base color: Slate
- CSS variables: Yes

### 3. 기본 컴포넌트 설치

```bash
pnpm dlx shadcn@latest add \
  button input label dialog select toast badge tabs card \
  dropdown-menu form textarea separator avatar switch \
  checkbox radio-group
```

### 4. 추가 패키지 설치

```bash
pnpm add \
  zod \
  react-hook-form \
  @hookform/resolvers \
  lucide-react \
  clsx \
  tailwind-merge \
  date-fns \
  date-fns-tz \
  nanoid \
  next-themes
```

### 5. 폴더 구조 생성

```bash
mkdir -p \
  app/\(auth\)/login \
  app/\(auth\)/signup \
  app/\(onboarding\)/profile \
  app/\(onboarding\)/keywords \
  app/\(onboarding\)/notifications \
  app/\(app\)/feed \
  app/\(app\)/saved \
  app/\(app\)/settings/profile \
  app/\(app\)/settings/keywords \
  app/\(app\)/settings/notifications \
  app/s/\[token\] \
  app/api/profile \
  app/api/keyword-groups \
  app/api/keywords/suggest \
  app/api/keywords/\[id\] \
  app/api/feed \
  app/api/news/\[news_id\]/translation \
  app/api/news/\[news_id\]/translate-body \
  app/api/saved \
  app/api/notification-settings \
  app/api/delivery-channels \
  app/api/shared-links \
  app/api/shared-links/public/\[token\] \
  app/api/cron/collect \
  app/api/cron/send-daily \
  app/api/admin/trigger \
  app/api/admin/stats \
  components/ui \
  components/layout \
  components/feed \
  components/onboarding \
  components/settings \
  components/shared \
  lib/supabase \
  lib/sources \
  lib/llm \
  lib/notify \
  db/schema \
  supabase/migrations \
  scripts \
  emails \
  public
```

### 6. .gitignore 추가 항목

`.gitignore` 파일에 다음 추가:

```
# Local env files
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Supabase
supabase/.branches
supabase/.temp
```

### 7. Git 초기화 및 첫 commit

```bash
git init
git add .
git commit -m "T-001: Next.js scaffold with shadcn/ui"
```

### 8. 동작 확인

```bash
pnpm dev
```

→ http://localhost:3000 에서 Next.js 기본 페이지가 보이면 성공.

---

## T-002: 환경변수 설정

### 1. `.env.example` 생성 (커밋용)

```bash
# === Supabase ===
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# === LLM ===
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# === News Sources ===
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GNEWS_API_KEY=

# === Email ===
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@yourdomain.com

# === Cron Security ===
CRON_SECRET=

# === App ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
ADMIN_EMAILS=your-email@example.com

# === Database ===
DATABASE_URL=

# === Monitoring (선택) ===
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

### 2. `.env.local` 생성 (gitignore됨, 실제 값 입력)

`.env.example`을 복사한 후 실제 값들을 채워 넣으세요:

```bash
cp .env.example .env.local
```

그리고 .env.local의 각 값을 채웁니다.

**CRON_SECRET 생성** (32자 이상 랜덤 문자열):
```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

**DATABASE_URL** (Supabase Dashboard → Project Settings → Database → Connection string → URI):
```
postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres
```

### 3. `lib/env.ts`

```typescript
import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // LLM
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),

  // News Sources
  NAVER_CLIENT_ID: z.string().min(1),
  NAVER_CLIENT_SECRET: z.string().min(1),
  GNEWS_API_KEY: z.string().min(1),

  // Email
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),

  // Cron
  CRON_SECRET: z.string().min(32, "CRON_SECRET must be at least 32 chars"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),
  ADMIN_EMAILS: z.string().default(""),

  // Database
  DATABASE_URL: z.string().min(1),

  // Sentry (optional)
  SENTRY_DSN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. Check .env.local");
}

export const env = parsed.data;

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = env.ADMIN_EMAILS.split(",").map((e) => e.trim());
  return admins.includes(email);
}
```

### 4. `next.config.mjs` 업데이트 (env 로딩 검증)

```javascript
// 빌드 시 환경변수 검증
import "./lib/env.js";

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
```

> Note: TypeScript 파일은 빌드 시 직접 import 불가. 대신 `next.config.mjs`에서는 검증 생략하고 첫 API 호출 시 검증하는 게 일반적.

### 5. 검증

```bash
pnpm dev
```

환경변수가 누락됐다면 명확한 에러 메시지가 콘솔에 표시됩니다.

---

## T-003: Supabase 클라이언트 셋업

### 1. `lib/supabase/server.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Component에서 호출 시 무시 가능
          }
        },
      },
    }
  );
}

// 관리자 작업용 (Service Role)
export function createAdminClient() {
  const { createClient } = require("@supabase/supabase-js");
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

### 2. `lib/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
```

### 3. `lib/supabase/middleware.ts`

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 자동 갱신
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 인증 필요한 경로
  const protectedPaths = ["/feed", "/saved", "/settings", "/onboarding", "/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  // 비로그인이면서 보호 경로 접근 시
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // 로그인했는데 로그인/회원가입 페이지 접근 시
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  // 온보딩 미완료 체크 (보호 경로 + 온보딩 경로 외)
  if (user && isProtected && !pathname.startsWith("/onboarding")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .single();

    if (profile && !profile.onboarding_completed) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding/profile";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
```

### 4. 루트 `middleware.ts`

```typescript
import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음 경로 제외:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico
     * - public 폴더 파일
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## T-004: Vercel 배포 가이드 (코드 없음, 단계만)

### 1. GitHub Repo Push

```bash
# GitHub에서 빈 repo 만들고 (Public/Private 둘 다 OK)
git remote add origin https://github.com/yourusername/intelligence-news-app.git
git branch -M main
git push -u origin main
```

### 2. Vercel에서 Import

1. https://vercel.com/new 접속
2. "Import Git Repository" → GitHub 계정 연동
3. `intelligence-news-app` 선택 → Import
4. **Framework Preset**: Next.js (자동 감지)
5. **Build Command**: `pnpm build` (자동)
6. **Install Command**: `pnpm install` (자동)

### 3. 환경변수 등록

Settings → Environment Variables에서 `.env.local`의 모든 키를 등록:

- **Production**: 실제 운영용 값
- **Preview**: 개발용 값 (같아도 OK)
- **Development**: 같음

> ⚠️ `NEXT_PUBLIC_APP_URL`은 Production에서 `https://your-domain.vercel.app` 또는 본인 도메인으로 변경

### 4. 도메인 연결 (선택)

Settings → Domains → Add domain

본인 도메인이 있다면 CNAME 레코드 설정 안내가 나옵니다.

### 5. 첫 배포 확인

main 브랜치에 push하면 자동 배포됩니다:

```bash
git add .
git commit -m "T-004: Vercel ready"
git push
```

Vercel Dashboard에서 빌드 진행 확인 → 성공 시 URL 접속.

---

## T-005: Supabase 마이그레이션 실행 가이드

### 1. 파일 복사

```bash
cp 03_DATA_MODEL.sql supabase/migrations/0001_init.sql
```

### 2. Supabase Dashboard에서 실행

1. https://supabase.com/dashboard → 프로젝트 선택
2. 왼쪽 메뉴 → **SQL Editor**
3. **+ New query** 클릭
4. `supabase/migrations/0001_init.sql` 전체 내용 복붙
5. 우측 하단 **RUN** 버튼

### 3. 실행 결과 확인

성공하면 "Success. No rows returned" 메시지가 나옵니다.

다음 SQL로 테이블 생성 확인:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

예상 결과 (12개 테이블):
```
api_usage_log
delivery_channels
insights
keyword_groups
keywords
news_clusters
news_items
notification_settings
saved_news
shared_links
translations
user_news_feed
user_profiles
```

### 4. pgvector 확장 확인

```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

결과에 `vector`가 보이면 OK.

### 5. RLS 정책 확인

```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

각 사용자 데이터 테이블에 정책이 적용된 것 확인.

### 6. 트리거 확인

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

`on_auth_user_created`가 보이면 OK (회원가입 시 자동 프로필 생성).

### 7. 테스트 INSERT

```sql
-- 테스트용 더미 데이터 (나중에 seed.ts로 대체)
-- 본인 user_id로 변경 (auth.users에서 가져오기)
SELECT id FROM auth.users LIMIT 1;
```

위 쿼리로 사용자 ID 확보 후, 키워드 그룹 하나 만들기:

```sql
-- :user_id 부분을 실제 ID로 변경
INSERT INTO keyword_groups (user_id, category, name)
VALUES ('YOUR_USER_ID', 'competitor', '경쟁사');

SELECT * FROM keyword_groups;
```

성공하면 row 1개 보임 → RLS는 anon key로 접근할 때 적용되므로 SQL Editor(service role)에서는 모두 보임.

### 8. 클린업 (선택)

마이그레이션 SQL이 정상 실행된 후 테스트 INSERT는 지우려면:

```sql
DELETE FROM keyword_groups WHERE name = '경쟁사';
```

---

## 🎯 T-005 완료 후

여기까지 오면 다음이 모두 준비됩니다:

- ✅ Next.js 프로젝트 동작 (`pnpm dev`)
- ✅ 환경변수 검증 시스템
- ✅ Supabase 클라이언트 (서버/클라이언트/관리자)
- ✅ 인증 미들웨어 (보호 경로 + 온보딩 체크)
- ✅ Vercel 자동 배포
- ✅ DB 스키마 생성 + RLS 정책 + 트리거

**다음**: T-006 (Drizzle ORM 셋업)부터는 Claude Code에게 맡기시면 됩니다.
이 5개 티켓이 가장 까다로워서 참고 코드를 만든 거고, 이후는 Claude Code가
사양서 보면서 잘 처리합니다.

---

## 💡 디버깅 팁

### "Module not found" 에러
```bash
# 모든 패키지 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Supabase 연결 안 됨
- `.env.local`의 URL과 키 재확인 (오타 흔함)
- Supabase 프로젝트가 일시정지 상태인지 확인 (Free tier는 1주일 미사용시 paused)

### TypeScript 에러
```bash
# 타입 다시 빌드
rm -rf .next
pnpm dev
```

### Tailwind 스타일 안 먹힘
- `tailwind.config.ts`의 `content` 경로 확인
- `app/globals.css`에 `@tailwind` 디렉티브 있는지 확인

### Git push 실패 (큰 파일)
```bash
# .gitignore에 빠진 게 있는지 확인
git rm --cached -r node_modules .next
git commit -m "Remove large files"
git push
```

---

## 🚀 다음 단계

T-006부터는 Claude Code에게 다음과 같이 지시하세요:

```
T-005까지 완료됐어. 이제 T-006 (Drizzle ORM 셋업) 시작하자.

07_TICKETS.md의 T-006 명세와
02_TECH_SPEC.md의 db/ 폴더 구조를 참고해서 만들어줘.

각 테이블별로 schema 파일을 분리하고,
pgvector는 customType으로 정의해야 해.
```

Claude Code는 이 사양서 폴더 안에 있는 모든 파일을 참조할 수 있으니,
자세한 설명 없이도 일관성 있게 작업합니다.

🎉 화이팅하세요!
