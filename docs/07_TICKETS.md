# 07. Work Tickets (53개)

이 문서는 AI 코딩 에이전트가 순서대로 실행할 작업 티켓입니다.
각 티켓은 독립 실행 가능한 최소 단위로 쪼개져 있습니다.

---

## 📌 AI 에이전트 작업 규칙

1. **순서대로 진행**. T-001부터 시작.
2. **티켓 완료 시 사용자에게 보고** 후 다음 진행 여부 확인.
3. **체크박스로 진행 상황 추적** (이 파일 직접 수정 OK).
4. **외부 API 키 필요 시 사용자에게 요청** (절대 임의 입력 금지).
5. **사양서와 다른 결정이 필요하면 사용자 확인**.
6. **모든 코드는 TypeScript strict mode** + Zod 검증.

---

## Day 0 — 사전 준비 (사용자 직접)

다음 계정·키가 모두 발급되어야 개발 시작 가능. **사용자에게 확인 후 시작**:

```
☐ GitHub 계정 + 새 빈 repo
☐ Vercel 계정 + GitHub 연결
☐ Supabase 프로젝트 (Seoul 리전)
   - SUPABASE_URL, ANON_KEY, SERVICE_ROLE_KEY 확보
☐ Anthropic API 키
☐ OpenAI API 키 (임베딩)
☐ Resend 계정 + 도메인 인증
☐ 네이버 검색 API 앱 등록
   - CLIENT_ID, CLIENT_SECRET 확보
☐ GNews API 무료 회원가입
   - API_KEY 확보
☐ Sentry 프로젝트 생성 (선택)
```

---

## 🗓️ 1주차 — 기초 인프라

### Day 1 — 프로젝트 셋업

#### T-001 · Next.js + Tailwind + shadcn/ui 스캐폴드 ⏱️ 2h

**Goal**: 빈 폴더에서 Next.js 14 App Router 프로젝트가 동작.

**Tasks**:
- [x] `pnpm create next-app@14 .` (Next.js 14, TS, Tailwind, ESLint, no src-dir)
- [x] shadcn/ui 초기화: `shadcn@2.1.8 init` (Tailwind 3 호환 버전 사용)
- [x] 기본 컴포넌트 설치: button, input, label, dialog, select, toast, badge, tabs, card
- [x] `02_TECH_SPEC.md`의 폴더 구조 그대로 생성
- [x] ESLint + Prettier 설정
- [x] Husky + lint-staged 설정
- [x] `pnpm build` 통과 확인 (타입체크 포함)

**Done When**: `localhost:3000` 접속 → Next.js 기본 페이지 표시.

---

#### T-002 · 환경변수 + 시크릿 관리 ⏱️ 1h

**Goal**: 모든 환경변수가 Zod로 검증되고 타입 안전하게 사용 가능.

**Tasks**:
- [x] `.env.local` 작성 (Supabase·Anthropic·CRON_SECRET 입력 완료)
- [x] `.env.example` 작성 (`02_TECH_SPEC.md` 참고)
- [x] `.gitignore`에 `.env.local` 포함 확인 (git check-ignore 통과)
- [x] `lib/env.ts` 생성 — Zod 검증 (1주차 키 필수 / 2~3주차 키 선택)

```typescript
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1),
  NAVER_CLIENT_ID: z.string().min(1),
  NAVER_CLIENT_SECRET: z.string().min(1),
  GNEWS_API_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email(),
  CRON_SECRET: z.string().min(32),
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

**Done When**: 환경변수 누락 시 빌드 실패 (안전망 동작).

---

#### T-003 · Supabase 클라이언트 셋업 ⏱️ 2h

**Tasks**:
- [x] `pnpm add @supabase/supabase-js @supabase/ssr`
- [x] `lib/supabase/server.ts` — 서버 컴포넌트용
- [x] `lib/supabase/client.ts` — 클라이언트 컴포넌트용
- [x] `lib/supabase/middleware.ts` — 세션 자동 갱신 + 보호 라우트 리다이렉트
- [x] `middleware.ts` 루트에 작성, 인증 보호 라우트 정의 (/feed /saved /settings /onboarding)
- [x] 동작 검증: 비로그인 시 /feed → 307 /login 리다이렉트 확인

**참고**: Supabase 공식 Next.js SSR 가이드 그대로.

**Done When**: 세션 쿠키 자동 갱신 동작 확인.

---

#### T-004 · Vercel 자동 배포 연결 ⏱️ 1h

**Tasks**:
- [ ] GitHub repo 첫 푸시
- [ ] Vercel에서 import → 프로젝트 생성
- [ ] Vercel 환경변수 모두 등록 (Production + Preview)
- [ ] Preview deploy 동작 확인
- [ ] (선택) 도메인 연결

**Done When**: GitHub push → Vercel preview URL 자동 생성.

---

### Day 2 — DB 스키마

#### T-005 · 마이그레이션 SQL 실행 ⏱️ 1h

**Tasks**:
- [x] `supabase/migrations/0001_init.sql` 생성 — `03_DATA_MODEL.sql` 전체 내용 복사
- [x] Supabase Dashboard > SQL Editor에서 실행 (Success. No rows returned)
- [x] 모든 테이블·인덱스·RLS 정책 생성 확인 (13개 테이블)
- [x] pgvector 확장 enable 확인 (vector, uuid-ossp, pg_trgm)

**Done When**: Supabase Dashboard에서 모든 테이블 보임.

---

#### T-006 · Drizzle ORM 셋업 ⏱️ 2h

**Tasks**:
- [x] `pnpm add drizzle-orm postgres`
- [x] `pnpm add -D drizzle-kit` (+ dotenv)
- [x] `drizzle.config.ts` 작성 (.env.local 로드, DATABASE_URL 사용)
- [x] `db/schema/` 폴더에 테이블별 schema 파일 (users/keywords/news/insights/notifications/shared_links/api_usage)
- [x] `db/index.ts` — Drizzle 인스턴스 생성 (postgres-js, prepare:false)
- [x] 실DB 연결 검증: 13개 테이블 + 확장 3개 조회 성공

**참고**: schema는 SQL과 1:1 매칭. pgvector는 drizzle 내장 `vector(1536)` 사용.

**Done When**: Drizzle Studio에서 모든 테이블 조회 가능.

---

#### T-007 · 시드 데이터 ⏱️ 1h

**Tasks**:
- [x] `scripts/seed.ts` — 테스트 유저 1명(test@intelligence.local), 키워드그룹 4개, 뉴스 10건, 시사점/피드 10건
- [x] `pnpm seed` 명령 실행 시 데이터 삽입
- [x] 멱등성 보장 (2회 실행해도 개수 동일: onConflictDoNothing + 그룹 재생성)

---

### Day 3 — 인증

#### T-008 · Supabase Auth 통합 ⏱️ 3h

**Tasks**:
- [x] 로그인 페이지 `/login` — 이메일/비번 + Google + Kakao 버튼
- [x] 회원가입 페이지 `/signup` (이름+이메일+비번+약관)
- [x] OAuth 콜백 `/auth/callback` 라우트 (코드→세션 교환)
- [x] 로그아웃 액션 (lib/actions/auth.ts)
- [ ] Supabase Dashboard에서 OAuth 프로바이더 활성화 (Google, Kakao) — 사용자 작업, 가이드 제공
- [x] 검증: 테스트 계정 로그인 성공(세션 발급) 확인

**Done When**: 가입 → 로그인 → 세션 유지 → 로그아웃 전체 플로우 동작.

---

#### T-009 · USER_PROFILES 자동 생성 확인 ⏱️ 1h

**Tasks**:
- [x] `03_DATA_MODEL.sql`의 `handle_new_user` 트리거가 동작하는지 확인
- [x] 테스트 가입 후 `user_profiles` row 자동 생성 확인
- [x] RLS 정책 동작 확인 (비로그인 차단 / 본인만 조회 / 타인 조회 불가)

---

#### T-010 · 기본 레이아웃 + 헤더 ⏱️ 2h

**Tasks**:
- [x] `app/(app)/layout.tsx` — 인증된 사용자용 레이아웃 (user 조회 + Header)
- [x] `components/layout/Header.tsx` — 로고/검색/알림/설정/아바타 드롭다운(프로필·설정·로그아웃)
- [x] 다크모드 토글 (next-themes + ThemeProvider + ThemeToggle)
- [x] 모바일 반응형 (sticky, backdrop-blur, max-w-3xl)

---

### Day 4 — 온보딩

#### T-011 · 온보딩 1단계: 계정 정보 ⏱️ 2h

**Tasks**:
- [x] `app/(onboarding)/layout.tsx` — 진행바 + 공통 프레임 + 게이트
- [x] `app/(onboarding)/profile/page.tsx`
- [x] 게이트: `onboarding_completed = false`면 (app) 레이아웃에서 온보딩으로 리다이렉트

---

#### T-012 · 온보딩 2단계: 비즈니스 프로필 ⏱️ 3h

**Tasks**:
- [x] 폼 (react-hook-form + Zod, `06_UI_SPEC.md` 스키마)
- [x] 업종 select, 회사 규모 select
- [x] 태그 입력 컴포넌트 (제품·서비스 / 타겟 고객) — components/onboarding/TagInput
- [x] `PUT /api/profile` 호출 (+ 표시이름은 auth 메타데이터)
- [x] 타임존 자동 감지: `Intl.DateTimeFormat().resolvedOptions().timeZone`

---

#### T-013 · 온보딩 3단계: 키워드 등록 ⏱️ 3h

**Tasks**:
- [ ] 4개 그룹 카드 (경쟁사/업계/제품/일반)
- [ ] 태그 입력 (그룹별)
- [ ] "AI 추천 키워드" 버튼 → `POST /api/keywords/suggest`
- [ ] 추천 결과 모달 → 체크박스 선택 → 추가
- [ ] 완료 시 `onboarding_completed = true` 업데이트

**Note**: API `/api/keywords/suggest`는 T-025와 함께 구현 (LLM 호출).

---

### Day 5 — 키워드 관리 + 1주차 마무리

#### T-014 · 키워드 관리 페이지 ⏱️ 3h

**Tasks**:
- [ ] `/settings/keywords` 페이지
- [ ] 그룹별 키워드 목록 + 추가/삭제
- [ ] 그룹 추가/이름 변경
- [ ] 키워드별 소스 선택 (네이버/GNews/RSS)
- [ ] 활성/비활성 토글

---

#### T-015 · 1주차 통합 테스트 ⏱️ 2h

**Tasks**:
- [ ] 가입 → 온보딩 → 키워드 등록 → 메인 페이지 전체 플로우 수동 테스트
- [ ] 버그 픽스
- [ ] Preview 배포 + 본인 폰에서 확인
- [ ] **체크포인트**: 사용자에게 데모 보여드리고 피드백 수렴

---

#### T-016 · 1주차 회고 + 2주차 준비 ⏱️ 1h

**Tasks**:
- [ ] 막힌 부분 정리
- [ ] 외부 API 키 정상 동작 재확인 (네이버, GNews, Anthropic, OpenAI)
- [ ] 다음 주 시작 전 사용자 확인

✅ **1주차 끝 마일스톤**: 사용자가 가입하고 회사 프로필과 키워드를 등록할 수 있음.

---

## 🗓️ 2주차 — 수집 + AI 처리

### Day 6 — 뉴스 수집 어댑터

#### T-017 · 네이버 검색 API 어댑터 ⏱️ 3h

**Tasks**:
- [ ] `lib/sources/naver.ts`
- [ ] `searchNaverNews(keyword, options)` → `NewsItem[]`
- [ ] HTML 태그 제거 (`<b>` 등 응답에 포함됨)
- [ ] 본문은 link로 한 번 더 fetch (Mozilla Readability 또는 단순 추출)
- [ ] 레이트 리미트: 초당 10건 이하 (`p-limit` 사용)
- [ ] 에러 핸들링 + 재시도

**API 사용법**:
```typescript
const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(keyword)}&display=20&sort=date`;
headers: {
  "X-Naver-Client-Id": env.NAVER_CLIENT_ID,
  "X-Naver-Client-Secret": env.NAVER_CLIENT_SECRET,
}
```

---

#### T-018 · GNews API 어댑터 ⏱️ 2h

**Tasks**:
- [ ] `lib/sources/gnews.ts`
- [ ] `searchGNews(keyword, options)` → `NewsItem[]`
- [ ] 다국어 지원 (lang 파라미터)
- [ ] 무료 한도 일일 100건 관리 (`api_usage_log` 활용)

---

#### T-019 · RSS 어댑터 ⏱️ 3h

**Tasks**:
- [ ] `pnpm add rss-parser`
- [ ] `lib/sources/rss.ts`
- [ ] 관리자 설정 파일 또는 DB에 RSS URL 목록
- [ ] 초기 RSS 등록:
  - Reuters Technology: `https://feeds.reuters.com/reuters/technologyNews`
  - TechCrunch: `https://techcrunch.com/feed/`
  - The Verge: `https://www.theverge.com/rss/index.xml`
  - Ars Technica: `https://feeds.arstechnica.com/arstechnica/index`
- [ ] 키워드 매칭 (제목·요약에 포함 여부)

---

#### T-020 · 통합 수집기 ⏱️ 2h

**Tasks**:
- [ ] `lib/sources/index.ts` — `collectForKeyword(keyword, sources[])` → 통합 결과
- [ ] 어댑터 병렬 호출 (`Promise.allSettled`)
- [ ] 한 어댑터 실패가 전체 실패로 번지지 않게
- [ ] 결과 통합 + 기본 dedup (URL 기준)

---

### Day 7 — Dedup + 임베딩

#### T-021 · URL 정규화 + 1차 dedup ⏱️ 2h

**Tasks**:
- [ ] `lib/dedup.ts` — `canonicalizeUrl(url)` 함수
- [ ] 쿼리 파라미터 제거 (`utm_*`, `ref`, `source` 등)
- [ ] 모바일 URL 통합 (`m.naver.com` → `naver.com`)
- [ ] DB upsert: `url_canonical`이 unique key

---

#### T-022 · OpenAI 임베딩 ⏱️ 2h

**Tasks**:
- [ ] `lib/embed.ts`
- [ ] `createEmbedding(text)`, `createEmbeddings(texts[])` (배치)
- [ ] 비용 로깅 (`api_usage_log`)
- [ ] 텍스트 길이 제한 (8000자)

---

#### T-023 · pgvector 의미 dedup ⏱️ 4h

**Tasks**:
- [ ] `lib/dedup.ts` — `findOrCreateCluster(newsItem)` 함수
- [ ] `find_similar_cluster` SQL 함수 호출 (코사인 유사도 ≥ 0.88)
- [ ] 매칭되면 기존 클러스터에 추가
- [ ] 없으면 새 클러스터 생성
- [ ] `news_clusters.news_count` 증가
- [ ] `representative_news_id`는 가장 빠른 published_at + 신뢰도 높은 매체

**SQL 호출**:
```typescript
const result = await db.execute(sql`
  SELECT find_similar_cluster(${embedding}::vector, 0.88) AS cluster_id
`);
```

---

### Day 8 — LLM 통합 분석

#### T-024 · Claude API 클라이언트 ⏱️ 2h

**Tasks**:
- [ ] `pnpm add @anthropic-ai/sdk`
- [ ] `lib/llm/client.ts` — Anthropic 인스턴스
- [ ] 재시도 로직 (`04_LLM_PROMPTS.md` 참고)
- [ ] 토큰 사용량 로깅

---

#### T-025 · 통합 분석 프롬프트 구현 ⏱️ 3h

**Tasks**:
- [ ] `lib/llm/prompts.ts` — `04_LLM_PROMPTS.md`의 프롬프트 그대로 옮김
- [ ] `lib/llm/analyze.ts` — `analyzeNews()`, `analyzeNewsWithRetry()`
- [ ] `lib/llm/schema.ts` — Zod 검증 스키마
- [ ] `lib/llm/suggest-keywords.ts` — 키워드 추천 함수
- [ ] `POST /api/keywords/suggest` 엔드포인트 구현 (T-013 보완)

---

#### T-026 · 시사점·번역 저장 ⏱️ 2h

**Tasks**:
- [ ] 분석 결과를 `insights`(사용자별), `translations`(글로벌) 테이블에 분리 저장
- [ ] 번역 캐시 hit 시 LLM 호출 스킵
- [ ] 트랜잭션으로 일관성 보장

---

#### T-027 · 사전 필터링 휴리스틱 ⏱️ 1h

**Tasks**:
- [ ] `lib/dedup.ts` — `shouldSkipForLLM(news)` 함수
- [ ] `04_LLM_PROMPTS.md`의 규칙 적용 (광고성, 너무 짧은 본문 등)

---

### Day 9 — 스케줄러 + 피드 생성

#### T-028 · Vercel Cron 설정 ⏱️ 1h

**Tasks**:
- [ ] `vercel.json` 작성 (`02_TECH_SPEC.md` 참고)
- [ ] `app/api/cron/collect/route.ts` 스켈레톤
- [ ] `Authorization: Bearer ${CRON_SECRET}` 검증

---

#### T-029 · 사용자별 피드 생성 잡 ⏱️ 4h

**Tasks**:
- [ ] `app/api/cron/collect/route.ts` 완성
- [ ] 활성 사용자 순회 → 키워드 → 수집 → dedup → 분석 → 적재
- [ ] 사용자 청크 처리 (한 번에 5명씩)
- [ ] 진행 상황 로깅
- [ ] 통계 반환

**처리 흐름**:
```
1. 모든 활성 사용자 조회
2. 사용자 청크(5명)별 병렬 처리
   a. 사용자의 키워드 + 소스 조합으로 수집
   b. URL canonical로 1차 dedup
   c. 임베딩 생성 → 클러스터 매칭
   d. 휴리스틱 필터
   e. 통과한 뉴스만 Claude API 호출
   f. insights + translations + user_news_feed 저장
3. 통계 반환
```

---

#### T-030 · 수동 트리거 ⏱️ 1h

**Tasks**:
- [ ] `app/api/admin/trigger/route.ts`
- [ ] 관리자 이메일 화이트리스트 검증
- [ ] 사용자별/전체 즉시 실행

---

### Day 10 — 모니터링 + 마무리

#### T-031 · Sentry 통합 ⏱️ 2h

**Tasks**:
- [ ] `pnpm add @sentry/nextjs`
- [ ] `pnpm sentry-wizard` 실행
- [ ] 서버·클라이언트 모두 캐치

---

#### T-032 · 운영 대시보드 ⏱️ 3h

**Tasks**:
- [ ] `/admin` 페이지 (관리자만)
- [ ] 일별 수집 건수, LLM 비용, 활성 사용자
- [ ] Recharts로 간단한 차트

---

#### T-033 · 2주차 통합 테스트 ⏱️ 2h

**Tasks**:
- [ ] 본인 계정으로 수동 트리거
- [ ] 영어 뉴스 5건 + 한국어 뉴스 5건 분석 품질 확인
- [ ] 시사점이 진짜 "내 회사 관점"인지 검수
- [ ] **체크포인트**: 사용자에게 분석 결과 보여드리고 품질 확인

✅ **2주차 끝 마일스톤**: 새벽 cron이 돌면 모든 사용자의 피드가 채워지고, 시사점 포함된 분석이 DB에 쌓임.

---

## 🗓️ 3주차 — UI + 알림 + 공유 + 출시

### Day 11 — 데일리 피드 UI

#### T-034 · 피드 데이터 로딩 ⏱️ 2h

**Tasks**:
- [ ] `app/(app)/feed/page.tsx` — Server Component
- [ ] `user_news_feed` JOIN `news_items`, `insights`, `translations`
- [ ] 날짜별 페이지네이션 (전날/다음날)
- [ ] `GET /api/feed` 엔드포인트

---

#### T-035 · 뉴스 카드 컴포넌트 ⏱️ 3h

**Tasks**:
- [ ] `components/feed/NewsCard.tsx` — `06_UI_SPEC.md` 그대로 구현
- [ ] 배지, 시사점 박스, 액션 바
- [ ] 번역 토글 (제목·요약 원문 ↔ 번역 전환)

---

#### T-036 · 카테고리 탭 필터 ⏱️ 2h

**Tasks**:
- [ ] `components/feed/CategoryTabs.tsx`
- [ ] URL 쿼리 동기화 (`?category=competitor`)
- [ ] 카운트 표시
- [ ] 검색 입력 (제목 부분 일치)

---

#### T-037 · 번역 토글 + 본문 lazy 로드 ⏱️ 1h

**Tasks**:
- [ ] `POST /api/news/[id]/translate-body` 엔드포인트
- [ ] 캐시 hit/miss 처리
- [ ] 토글 UI

---

### Day 12 — 저장 + 공유

#### T-038 · 북마크 기능 ⏱️ 2h

**Tasks**:
- [ ] `POST/DELETE /api/saved`
- [ ] `/saved` 페이지 (저장한 뉴스 목록)
- [ ] 메모 입력·수정

---

#### T-039 · 공유 모달 ⏱️ 4h

**Tasks**:
- [ ] `components/feed/ShareModal.tsx` — `06_UI_SPEC.md` 참고
- [ ] 포함 내용 선택
- [ ] 공유 방식 8가지
- [ ] Web Share API 통합

---

#### T-040 · 공개 링크 시스템 ⏱️ 3h

**Tasks**:
- [ ] `POST /api/shared-links`
- [ ] `GET /api/shared-links/public/[token]` (인증 불필요)
- [ ] `app/s/[token]/page.tsx` 공개 페이지
- [ ] OG 메타태그
- [ ] 만료 검증

---

### Day 13 — 알림 설정 + 이메일

#### T-041 · 알림 설정 화면 ⏱️ 3h

**Tasks**:
- [ ] `/settings/notifications` 페이지 — `06_UI_SPEC.md` 그대로
- [ ] 주기·시각·채널·표시 옵션
- [ ] `PUT /api/notification-settings`

---

#### T-042 · 이메일 템플릿 ⏱️ 3h

**Tasks**:
- [ ] `pnpm add resend @react-email/components`
- [ ] `emails/DailyDigest.tsx` — React Email
- [ ] 상단 요약 + 카테고리별 카드 + 시사점
- [ ] 다크모드 대응
- [ ] Gmail, Outlook, 네이버에서 실제 발송 테스트

---

#### T-043 · Resend 발송 잡 ⏱️ 2h

**Tasks**:
- [ ] `app/api/cron/send-daily/route.ts`
- [ ] 사용자별 시각·채널 매칭
- [ ] 발송 로그
- [ ] 실패 시 재시도 (1회)

---

### Day 14 — Slack + Discord

#### T-044 · Slack 연결 플로우 ⏱️ 3h

**Tasks**:
- [ ] `POST /api/delivery-channels` (Slack)
- [ ] Webhook URL 입력 UI
- [ ] "테스트 발송" 버튼
- [ ] 채널명 자동 추출 (가능하면)

---

#### T-045 · Slack 메시지 포매팅 ⏱️ 2h

**Tasks**:
- [ ] `lib/notify/slack.ts` — Block Kit 사용
- [ ] 카테고리별 묶음
- [ ] 시사점 인용 블록

---

#### T-046 · Discord Webhook ⏱️ 1h

**Tasks**:
- [ ] `lib/notify/discord.ts` — 동일 패턴
- [ ] 임베드 형식

---

#### T-047 · 알림 발송 통합 ⏱️ 2h

**Tasks**:
- [ ] `lib/notify/index.ts` — 채널별 어댑터 통합
- [ ] 한 사용자가 여러 채널 활성 시 동시 발송
- [ ] 부분 실패 격리

---

### Day 15 — 출시 준비

#### T-048 · 모바일 반응형 점검 ⏱️ 3h

**Tasks**:
- [ ] 실제 폰으로 4개 화면 모두 확인
- [ ] 터치 영역 ≥ 44px
- [ ] iOS Safari 100vh 처리
- [ ] PWA manifest.json

---

#### T-049 · 법적 페이지 ⏱️ 2h

**Tasks**:
- [ ] `/terms` 이용약관
- [ ] `/privacy` 개인정보처리방침
- [ ] 뉴스 저작권 고지문 추가

---

#### T-050 · 베타 모집 페이지 ⏱️ 2h

**Tasks**:
- [ ] `app/page.tsx` 랜딩 페이지
- [ ] 신청 폼 (이메일만)
- [ ] 베타 코드 발급 시스템

---

#### T-051 · 운영 런북 ⏱️ 1h

**Tasks**:
- [ ] `docs/RUNBOOK.md` 작성
- [ ] Cron 실패 대응
- [ ] LLM 실패 대응
- [ ] DB 백업 정책
- [ ] API 한도 초과 대응

---

### Day 16 — 베타 출시

#### T-052 · 베타 사용자 1차 모집 ⏱️ 2h

**Tasks**:
- [ ] 지인 5~10명에게 베타 코드 발송
- [ ] 가입 안내 메일
- [ ] 첫 24시간 모니터링

---

#### T-053 · 피드백 반영 ⏱️ 4h

**Tasks**:
- [ ] 핫픽스
- [ ] 다음 스프린트 백로그 정리
- [ ] **체크포인트**: 사용자에게 베타 결과 보고

✅ **MVP 완료 마일스톤**: 베타 사용자가 매일 아침 메일을 받고, 앱에서 피드를 보고, 공유 링크를 만들어 동료에게 보낼 수 있음.

---

## 📊 진행 추적

티켓 완료 시 체크박스 마킹:

- 1주차: T-001 ~ T-016 (16개)
- 2주차: T-017 ~ T-033 (17개)
- 3주차: T-034 ~ T-053 (20개)

**총 53개 티켓 = MVP 완성**

---

## 🆘 막혔을 때

1. **사양 모호**: 이 문서 또는 다른 사양서 재확인 → 그래도 모호하면 사용자에게 질문
2. **외부 API 실패**: 에러 메시지 그대로 보고, 한도/인증 확인
3. **타입 에러**: Zod 스키마와 DB 스키마 일치 여부 확인
4. **LLM 응답 이상**: 프롬프트 그대로 사용 중인지 확인, temperature 조정

---

## 🚀 베타 이후 (참고)

베타 4주 운영 후 다음 단계:
- 위클리 리포트
- 카카오 알림톡 (사업자 등록 후)
- 결제 시스템 (Stripe/토스)
- 팀 워크스페이스
- 분석 대시보드
