# 02. Technical Specification

## 1. 기술 스택 (확정)

### 1.1 프론트엔드
- **Next.js 14+** (App Router, TypeScript strict mode)
- **React 18+**
- **Tailwind CSS** + **shadcn/ui** 컴포넌트
- **lucide-react** 아이콘
- **react-hook-form** + **Zod** 폼 검증

### 1.2 백엔드
- **Next.js API Routes** (별도 백엔드 서버 없음)
- **Vercel Cron** (스케줄링)

### 1.3 데이터베이스 / 인증
- **Supabase PostgreSQL** (Seoul 리전)
- **Supabase Auth** (이메일, Google OAuth, Kakao OAuth)
- **pgvector** 확장 (임베딩 dedup)
- **Drizzle ORM** (TypeScript 타입 안전 쿼리)

### 1.4 LLM / AI
- **Anthropic Claude API** (`claude-sonnet-4-6` 모델)
- **OpenAI Embeddings API** (`text-embedding-3-small`)

### 1.5 외부 API (뉴스 소스)
- **네이버 검색 API** (국내 뉴스)
- **GNews API** (해외 뉴스, 무료 티어로 시작)
- **rss-parser** (RSS 피드, 자체 호스팅)

### 1.6 발송
- **Resend** (이메일)
- **Slack Incoming Webhooks** (사용자 본인 워크스페이스)
- **Discord Webhooks**

### 1.7 인프라
- **Vercel** (호스팅 + Cron + Edge Functions)
- **Sentry** (에러 모니터링)
- **Cloudflare** (도메인, 선택)

### 1.8 개발 도구
- **pnpm** 패키지 매니저
- **ESLint** + **Prettier**
- **Husky** + **lint-staged** (커밋 훅)
- **GitHub Actions** (CI, 선택)

---

## 2. 시스템 아키텍처

```
┌─────────────────────────────────────────────────┐
│  사용자 (브라우저 / 모바일 PWA)                 │
└────────────────┬────────────────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────────────────┐
│  Next.js App (Vercel)                          │
│  - App Router (React Server Components)         │
│  - API Routes                                   │
│  - Vercel Cron (매일 05:00 KST)                │
└────┬──────────┬──────────┬─────────────┬────────┘
     │          │          │             │
┌────▼──┐  ┌───▼──┐  ┌────▼────┐  ┌────▼─────────┐
│Supabase│  │Claude│  │OpenAI   │  │ News Sources │
│ - DB   │  │ API  │  │Embedding│  │ - Naver API  │
│ - Auth │  │      │  │ API     │  │ - GNews API  │
│ - RLS  │  │      │  │         │  │ - RSS Feeds  │
└────────┘  └──────┘  └─────────┘  └──────────────┘

┌─────────────────────────────────────────────────┐
│  Delivery Channels                              │
│  - Resend (Email)                               │
│  - Slack Webhook (user's workspace)             │
│  - Discord Webhook                              │
└─────────────────────────────────────────────────┘
```

---

## 3. 데이터 흐름 (일일 사이클)

```
05:00 KST  Vercel Cron 트리거 (/api/cron/collect)
  ↓
  사용자 전체 순회
  ↓
  각 사용자의 키워드 그룹 로드
  ↓
  키워드별 병렬 수집 (Naver + GNews + RSS)
  ↓
  URL 정규화 + 1차 dedup
  ↓
  임베딩 생성 (OpenAI)
  ↓
  pgvector 의미 dedup + 클러스터링
  ↓
  사전 필터링 (휴리스틱)
  ↓
  통과한 뉴스만 Claude API 호출
   - 번역 + 요약 + 카테고리 + 시사점
   - 1회 호출에 묶음
  ↓
  TRANSLATIONS, INSIGHTS, USER_NEWS_FEED 저장
  ↓
06:30 KST  Cron (/api/cron/send-daily) 트리거
  ↓
  사용자별 알림 설정 조회
  ↓
  시각 매칭되는 사용자에게 이메일/Slack/Discord 발송
```

---

## 4. 폴더 구조

```
intelligence-news-app/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (onboarding)/
│   │   ├── profile/page.tsx
│   │   ├── keywords/page.tsx
│   │   └── notifications/page.tsx
│   ├── (app)/
│   │   ├── feed/page.tsx         # 데일리 피드
│   │   ├── saved/page.tsx        # 저장한 뉴스
│   │   ├── settings/
│   │   │   ├── profile/page.tsx
│   │   │   ├── keywords/page.tsx
│   │   │   └── notifications/page.tsx
│   │   └── layout.tsx
│   ├── s/[token]/page.tsx        # 공유 링크 (공개)
│   ├── api/
│   │   ├── cron/
│   │   │   ├── collect/route.ts
│   │   │   └── send-daily/route.ts
│   │   ├── news/[id]/translate/route.ts
│   │   ├── shared-links/route.ts
│   │   └── admin/trigger/route.ts
│   ├── layout.tsx
│   └── page.tsx                  # 랜딩
├── components/
│   ├── ui/                       # shadcn/ui 컴포넌트
│   ├── feed/
│   │   ├── NewsCard.tsx
│   │   ├── CategoryTabs.tsx
│   │   └── ShareModal.tsx
│   ├── onboarding/
│   └── settings/
├── lib/
│   ├── supabase/
│   │   ├── server.ts             # 서버 컴포넌트용
│   │   ├── client.ts             # 클라이언트 컴포넌트용
│   │   └── middleware.ts
│   ├── sources/
│   │   ├── naver.ts
│   │   ├── gnews.ts
│   │   ├── rss.ts
│   │   └── index.ts              # 통합 수집기
│   ├── llm/
│   │   ├── client.ts             # Anthropic 클라이언트
│   │   ├── analyze.ts            # 통합 분석 함수
│   │   └── prompts.ts            # 프롬프트 템플릿
│   ├── embed.ts                  # OpenAI 임베딩
│   ├── dedup.ts                  # 중복 제거 로직
│   ├── notify/
│   │   ├── email.ts
│   │   ├── slack.ts
│   │   ├── discord.ts
│   │   └── index.ts
│   ├── env.ts                    # 환경변수 검증
│   └── utils.ts
├── db/
│   ├── schema/
│   │   ├── users.ts
│   │   ├── keywords.ts
│   │   ├── news.ts
│   │   └── index.ts
│   └── index.ts                  # Drizzle 인스턴스
├── supabase/
│   └── migrations/
│       └── 0001_init.sql         # 03_DATA_MODEL.sql 내용
├── emails/                       # React Email 템플릿
│   └── DailyDigest.tsx
├── public/
│   ├── logo.png
│   └── manifest.json             # PWA
├── scripts/
│   └── seed.ts
├── .env.local                    # 로컬 환경변수 (gitignore)
├── .env.example                  # 예시 (커밋)
├── vercel.json                   # Cron 설정
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## 5. 환경변수 명세

`.env.example` 파일 내용:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# LLM
ANTHROPIC_API_KEY=
OPENAI_API_KEY=

# News Sources
NAVER_CLIENT_ID=
NAVER_CLIENT_SECRET=
GNEWS_API_KEY=

# Email
RESEND_API_KEY=
RESEND_FROM_EMAIL=

# Cron Security
CRON_SECRET=

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=development

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
```

---

## 6. Vercel Cron 설정 (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/collect",
      "schedule": "0 20 * * *"
    },
    {
      "path": "/api/cron/send-daily",
      "schedule": "30 21 * * *"
    }
  ]
}
```

> Vercel Cron은 UTC 기준. `20:00 UTC = 05:00 KST`, `21:30 UTC = 06:30 KST`

---

## 7. 패키지 의존성 (`package.json`)

```json
{
  "name": "intelligence-news-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "seed": "tsx scripts/seed.ts"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@anthropic-ai/sdk": "^0.30.0",
    "openai": "^4.70.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "drizzle-orm": "^0.36.0",
    "postgres": "^3.4.0",
    "zod": "^3.23.0",
    "react-hook-form": "^7.53.0",
    "@hookform/resolvers": "^3.9.0",
    "resend": "^4.0.0",
    "@react-email/components": "^0.0.25",
    "rss-parser": "^3.13.0",
    "lucide-react": "^0.453.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "date-fns": "^4.1.0",
    "date-fns-tz": "^3.2.0",
    "nanoid": "^5.0.0",
    "@sentry/nextjs": "^8.0.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.0",
    "prettier": "^3.3.0",
    "prettier-plugin-tailwindcss": "^0.6.0",
    "drizzle-kit": "^0.28.0",
    "tsx": "^4.19.0",
    "husky": "^9.1.0",
    "lint-staged": "^15.2.0"
  }
}
```

---

## 8. 보안 원칙

1. **모든 사용자 데이터는 RLS로 격리** — Supabase RLS 정책 필수
2. **시크릿은 환경변수만** — 코드에 하드코딩 절대 금지
3. **Cron 엔드포인트는 시크릿 검증** — `Authorization: Bearer ${CRON_SECRET}`
4. **외부 API 호출은 서버 사이드에서만** — 키 노출 방지
5. **사용자 입력은 Zod 검증** — 모든 API 라우트
6. **공개 공유 링크는 토큰 + 만료** — 추측 불가능한 nanoid 사용
7. **CORS 명시적 허용** — 자체 도메인만

---

## 9. 성능 최적화 원칙

1. **번역은 글로벌 캐시** — 같은 뉴스 100명이 보면 번역 1번
2. **임베딩 dedup** — 같은 사건은 클러스터로 묶어 LLM 1번만 호출
3. **사전 휴리스틱 필터** — LLM 호출 전 30~50% 거르기
4. **Anthropic Batches API** — 새벽 배치는 50% 할인 적용
5. **Server Components 우선** — 클라이언트 번들 최소화
6. **이미지 최적화** — Next/Image, lazy loading
7. **DB 인덱스** — `(user_id, feed_date)`, `embedding` IVFFlat

---

## 10. 모니터링

### 10.1 추적할 메트릭
- **수집**: 일일 수집 건수, 소스별 성공률, dedup 비율
- **AI**: LLM 호출 수, 토큰 사용량, 평균 응답 시간
- **노출**: DAU, 세션 시간, 카드 클릭률
- **알림**: 이메일 발송/오픈/클릭률
- **에러**: Sentry로 모든 에러 수집

### 10.2 알림 채널
- 운영자 Slack 채널에 Sentry 알림 연동
- Cron 실패 시 즉시 알림
- 일일 운영 요약 메일 (관리자 본인에게)
