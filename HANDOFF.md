# 🚚 인수인계 (HANDOFF) — 새 PC / 새 Claude 계정에서 이어가기

> **이 파일이 핵심입니다.** 새 컴퓨터에서 `claude` 실행 후 이렇게 말하세요:
> **"HANDOFF.md 읽고 이어서 하자."**
> 그러면 (기억이 전혀 없는) 새 Claude도 이 파일만 보고 그대로 이어서 개발할 수 있습니다.
>
> 작성일: 2026-06-19 / 작성자: Megan(기획·가입 담당) + Claude(개발 담당)

---

## 0. 새 PC에서 시작하는 순서 (제일 먼저 볼 것) ✅

1. **프로그램 설치**: Node.js LTS, pnpm, git, Claude Code (`npm i -g @anthropic-ai/claude-code`)
2. **코드 내려받기**:
   ```bash
   git clone https://github.com/meganseo10-svg/intelligence-news-app.git
   cd intelligence-news-app
   ```
3. **비밀 키 파일 넣기**: 백업해둔 `.env.local` 파일을 이 폴더 안에 복사
   (GitHub엔 없음 — 보안상 일부러 안 올림. 아래 1번 항목 참고)
4. **설치**: `pnpm install`
5. **실행 확인**: `pnpm dev` → 브라우저에서 http://localhost:3000 열기
6. **개발 이어가기**: `claude` 실행 → "HANDOFF.md 읽고 이어서 하자"

---

## 1. ⚠️ 이 PC를 버리기 전에 꼭 백업할 것 — 비밀 키

`.env.local` 파일은 GitHub에 안 올라갑니다. **이 파일을 USB나 비밀번호 관리 앱에 꼭 백업하세요.**
새 PC에서 이 값들이 없으면 개발이 안 됩니다.

현재 **값이 채워져 있어서 꼭 옮겨야 하는 키** (이게 제일 중요):
- `NEXT_PUBLIC_SUPABASE_URL` ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- `SUPABASE_SERVICE_ROLE_KEY` ✅
- `CRON_SECRET` ✅
- `NEXT_PUBLIC_APP_URL` ✅
- `ADMIN_EMAILS` ✅
- `DATABASE_URL` ✅

아직 비어있는 키 (2주차에 발급받아 채울 예정 — 지금은 신경 X):
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` (AI 처리용)
- `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET`, `GNEWS_API_KEY` (뉴스 수집용)
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (이메일 발송용)
- `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` (모니터링, 선택)

> 💡 전체 키 목록과 형식은 `.env.example` 파일에 있음 (이건 GitHub에 올라가 있음).

---

## 2. 프로젝트 개요

- **무엇**: B2B 뉴스 인텔리전스 SaaS. 매일 새벽 키워드 기반으로 국내·해외 뉴스를 모아
  AI가 번역·요약·시사점 생성 → 이메일/Slack/Discord/인앱으로 배달.
- **사양서 위치(읽기 전용, 12개 문서)**:
  `Desktop\업무\AI\files\intelligence-news-app-spec\intelligence-news-app\`
  (`00_README.md`, `07_TICKETS.md`의 티켓 T-001~T-053 순서대로 진행, `REFERENCE_CODE_T001_T005.md` 참고)
  ⚠️ 이 사양서 폴더는 GitHub에 없음. 새 PC에서도 필요하면 따로 옮겨야 함.
- **작업 방식**: 티켓 단위로 하나씩 진행, 각 티켓 끝나면 보고. Megan은 가입/키 발급, Claude가 코드 작성.

---

## 3. 기술 스택 (실제 설치된 버전 — 사양서와 다르니 주의)

- Next.js **16** (App Router) / React **19** / Tailwind **4** / TypeScript / zod **4**
- Supabase (Postgres + Auth + RLS, Seoul 리전) — 새 키 형식 `sb_publishable_*`(공개) / `sb_secret_*`(비밀)
- Drizzle ORM (+ postgres.js, `prepare:false`, 트랜잭션 풀러 포트 6543)
- shadcn/ui (Radix base, style `radix-nova`) — `components/ui/`
- 패키지매니저 **pnpm**

---

## 4. ⚠️ 핵심 함정들 (실수하기 쉬운 부분)

- 미들웨어는 Next 16에서 `proxy.ts`로 이름이 바뀜 (함수명도 `proxy`).
- 라우트 그룹 `(폴더)`는 URL에서 제거됨 → 온보딩은 실제 세그먼트 `app/onboarding/...` 사용.
- 클라이언트 컴포넌트에서 `@/lib/env` import 금지 (서버 비밀 검증이라 브라우저에서 터짐).
  `lib/supabase/client.ts`는 `process.env.NEXT_PUBLIC_*` 직접 사용.
- 컨벤션 파일(middleware↔proxy) 바꾸면 `.next` 캐시 지우고 dev 재시작.
- pnpm 빌드 스크립트 막히면 `pnpm-workspace.yaml`의 `allowBuilds`에 추가.

---

## 5. ✅ 완료한 것 (1주차 — 완료!)

- **T-001** Next.js 스캐폴드 (localhost:3000 동작)
- **T-002** 환경변수 `.env.local` + `lib/env.ts` (Supabase 키 검증됨)
- **T-003** Supabase 클라이언트(server/client) + `proxy.ts` 인증 보호
- **T-005** DB 마이그레이션 실행 (표 13개 + pgvector + RLS + 트리거)
- **T-006** Drizzle ORM (`db/schema/*.ts`, `db/index.ts`, `drizzle.config.ts`)
- **T-008** 로그인/회원가입 화면 + OAuth 버튼 + `/auth/callback`, `/auth/signout`
- **T-009** 회원가입 시 `user_profiles` 자동 생성(트리거) 검증
- **T-011~013** 온보딩(회사정보 → 키워드) + `/feed` 빈 화면 + `app/(app)` 레이아웃
  - API: `/api/profile`(GET/PUT), `/api/keyword-groups`(GET/POST), `/api/keywords`(POST)
- 실제 브라우저에서 가입 → 온보딩 → 피드 전체 흐름 동작 확인 완료.

### ⏭️ 일부러 건너뛴 것
- **T-004** Vercel 배포 (GitHub 푸시는 함 / Vercel 연결은 나중)
- **T-007** 시드 데이터 (피드 UI 만들 때 같이)
- **T-010** 풀 헤더 (지금은 간단 버전)
- T-013의 "AI 추천 키워드" 버튼 (LLM 필요 → T-025와 함께)

---

## 6. 🔜 다음 할 일 — 2주차 (뉴스 수집 + AI 처리)

**먼저 필요한 추가 API 키** (Megan이 발급 → `.env.local`에 추가):
- 네이버 검색 API (Client ID / Secret)
- GNews API Key
- OpenAI API Key (임베딩용)
- Anthropic API Key (Claude 분석용)

**티켓 순서**:
T-017 네이버 어댑터 → T-018 GNews → T-019 RSS → T-020 통합수집 → T-021 URL dedup
→ T-022 임베딩 → T-023 pgvector dedup → T-024 Claude 클라이언트 → T-025 분석 프롬프트 → ...

---

## 7. GitHub 정보

- 저장소: https://github.com/meganseo10-svg/intelligence-news-app
- 현재 모든 코드가 푸시되어 있음 (1주차 완료분).
- 이 파일(`HANDOFF.md`)과 `PROGRESS.md`도 함께 올라가므로 새 PC에서 바로 보임.
