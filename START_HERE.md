# 🚀 START HERE — 새 Claude에게 (인수인계 파일)

> **새 계정·새 PC에서 Claude Code를 켜면, 가장 먼저 이 파일을 읽어주세요.**
> 이 파일 하나로 (1) 사용자가 누구인지 (2) 어떻게 도와야 하는지 (3) 무엇을 만들고 있는지 (4) 어디까지 했는지 (5) 다음에 뭘 할지 전부 파악할 수 있습니다.
>
> Megan에게: 새 PC에서 Claude를 켠 뒤 **"START_HERE.md 읽고 이어서 하자"** 라고 한마디만 하면 됩니다.

---

## 1. 사용자(Megan)는 누구인가 — ⚠️ 가장 중요

- **Megan은 첫 앱을 만드는 "처음 개발하는 사람"입니다.** (Windows 11 + PowerShell)
- 이메일: megan.seo@cyberdigm.co.kr
- **반드시 한국어로 대화하세요.**

### 어떻게 도와야 하나 (Megan이 직접 요청한 방식)
1. **한 번에 한 단계씩만.** 한 턴에 할 일은 딱 하나. 목록으로 여러 개 주지 말 것.
2. **복잡한 설명은 생략.** 쉽고 구체적으로.
3. **역할 분담:** 사람만 할 수 있는 일(계정 가입, API 키 발급, 웹사이트 버튼 클릭)은 Megan이 합니다. **코드 작성·명령 실행 등 기술적인 부분은 전부 Claude가 합니다.**
4. 각 작업(티켓) 끝나면 보고하고, 확인받은 뒤 다음으로.

---

## 2. 무엇을 만들고 있나 — 프로젝트 개요

**"Intelligence Daily News App"** — B2B 뉴스 인텔리전스 SaaS

매일 새벽 키워드 기반으로 국내·해외 뉴스를 자동 수집 → AI가 번역·요약하고 회사별 비즈니스 시사점 생성 → 이메일/Slack/Discord/인앱으로 배달.

- **사양서(읽기 전용, 진실의 원천):** 이제 **이 저장소 `docs/` 폴더 안에 같이 들어있음** ✅
  - 먼저 읽기: `docs/00_README.md`, `docs/07_TICKETS.md` (53개 티켓 T-001~T-053), `docs/REFERENCE_CODE_T001_T005.md`
  - (원본은 `Desktop\업무\AI\files\intelligence-news-app-spec\...` 에도 있지만, 새 PC에선 저장소의 `docs/`를 보면 됨)
- **프로젝트 코드:** `Desktop\intelligence-news-app\` (이 저장소)
- **GitHub(비공개):** https://github.com/meganseo10-svg/intelligence-news-app
- **🚀 실제 배포됨(라이브):** https://intelligence-news-app.vercel.app (Vercel)
- **진행 방식:** `docs/07_TICKETS.md`의 티켓을 순서대로 하나씩.
- **참고 — 자매 앱들:** Megan은 이 앱 외에도 `deepread`, `deepwrite`, `deep-hub`(셋을 묶는 허브+결제) 앱을 만들고 있음. 모두 `meganseo10-svg` GitHub에 별도 저장소로 백업됨. (위치: `Documents\deepread`, `deepwrite`, `deep-hub`)

---

## 3. 기술 스택 (⚠️ 실제 설치 버전 — 사양서와 다름)

사양서는 Next 14 / Tailwind 3 / React 18로 적혀 있지만, **실제로는 최신 버전으로 설치됨:**

- **Next.js 16** (App Router, Turbopack) / **React 19** / **Tailwind 4** / TypeScript / **zod 4**
- **Supabase** (Postgres + Auth + RLS, 서울 리전)
  - 새 키 형식: `sb_publishable_*`(=공개/anon) / `sb_secret_*`(=비밀/service_role)
  - Project ref: `alrmtbffdqcqppzxgjny`
- **Drizzle ORM** (+ postgres.js, `prepare:false`, 트랜잭션 풀러 포트 6543)
- **shadcn/ui** — **Radix** base, style `radix-nova`, baseColor neutral (`components/ui/`)
- **패키지매니저: pnpm.** 명령은 `pnpm -C "<프로젝트경로>" <cmd>` 형식으로.

---

## 4. ⚠️ 핵심 함정들 (꼭 기억할 것)

- **미들웨어 → `proxy.ts`:** Next 16에서 `middleware.ts`가 사라짐. 함수명도 `proxy`. 사양서가 "middleware.ts 수정"이라 하면 `proxy.ts`를 의미함. (인증 보호: `proxy.ts` + `lib/supabase/middleware.ts`의 `updateSession`)
- **라우트 그룹 `(폴더)`는 URL에서 제거됨:** 그래서 온보딩은 `(onboarding)`가 아니라 **실제 세그먼트** `app/onboarding/...` 사용. (`(auth)`, `(app)` 그룹은 URL에 prefix가 안 생겨서 괜찮음)
- **클라이언트 컴포넌트에서 `@/lib/env` import 절대 금지:** 서버 전용 비밀을 검증해서 브라우저에서 터짐. `lib/supabase/client.ts`는 `process.env.NEXT_PUBLIC_*`를 직접 읽음.
- **컨벤션 파일 이름 바꾸면(middleware↔proxy)** `.next` 캐시 지우고 dev 재시작 (안 그러면 500 에러).
- **Supabase 새 키는 JS 클라이언트로만:** raw REST 호출(`apikey`/`Bearer` 헤더)은 401. 반드시 `@supabase/supabase-js` 사용.
- **DATABASE_URL:** 트랜잭션 풀러 URI(포트 6543), 비밀번호 `!`는 `%21`로 url-encode.
- **이메일 확인(Confirm email):** 가입→온보딩→피드 전체 흐름을 테스트하려면 Supabase에서 OFF여야 함 (Auth → Sign In/Providers → Email → "Confirm email" off).
- **Google/Kakao OAuth 버튼:** 코드는 연결됨. Supabase 대시보드에서 provider 설정 전까지는 에러남.
- **shadcn 컴포넌트 추가 시:** shadcn 4.8은 Base UI가 기본 → `-b radix` 강제할 것.

---

## 5. ✅ 완료한 것 — ⚠️ 거의 다 만들어졌고 배포까지 됨!

> **중요:** 이 앱은 이미 거의 완성 단계입니다. 1주차가 아니라 **T-001~T-051 대부분 완료 + Vercel 라이브 배포**까지 끝난 상태예요. 아래 목록을 보고 **이미 된 것을 다시 만들지 마세요.**
> (정확한 내역은 `git log --oneline`으로 항상 확인 가능)

**1주차 — 기반 (완료)**
- T-001~T-003 스캐폴드 / 환경변수(`lib/env.ts`) / Supabase 클라이언트 + `proxy.ts` 인증
- T-004 ✅ **Vercel 배포 완료** (https://intelligence-news-app.vercel.app)
- T-005~T-007 DB 마이그레이션(13개 표 + pgvector + RLS) / Drizzle ORM / 시드
- T-008~T-010 로그인·회원가입·OAuth / `user_profiles` 트리거 / 레이아웃·헤더
- T-011~T-014 온보딩(프로필→키워드) / 키워드 관리 페이지 + CRUD API
- T-015~T-016 1주차 통합 테스트·회고

**2주차 — 뉴스 수집 + AI 처리 (완료)**
- T-017~T-021 네이버·GNews·RSS 어댑터 / 통합 수집기 / URL 정규화·dedup
- T-022~T-023 OpenAI 임베딩 / pgvector 의미 중복제거
- T-024~T-027 Claude(LLM) 클라이언트 / 통합 분석 프롬프트 / 시사점·번역 저장 / 사전 필터
- T-028~T-030 Vercel Cron / 사용자별 피드 생성 잡 / 수동 트리거
- T-032 운영 대시보드(`/admin`, 통계 + 7일 차트)

**3주차 — UI + 알림 + 배포 (대부분 완료)**
- T-034~T-037 피드 로딩 / 뉴스 카드 / 카테고리·검색 필터 / 번역 토글·본문 lazy
- T-038~T-040 북마크(`/saved`) / 공유 모달 / 공개 링크(`/s/[token]`)
- T-041~T-043 알림 설정 화면 / 이메일 템플릿 / **Resend 이메일 발송** (검증됨)
- T-048~T-051 모바일 반응형 / 법적 페이지(약관·개인정보) / 베타 모집 랜딩 / 운영 런북(`docs/RUNBOOK.md`)

**사양서 밖 추가 기능 (완료)**
- 트렌드 인사이트 대시보드(`/insights`), 글로벌 뉴스 보강(GNews 다국어 + RSS 추가),
  프로필 인사이트 기준(트렌드/강점/약점/영업/위협), 본문 전체 기반 분석, SNS 공유

---

## 6. 🔜 다음 할 일 — 아직 안 된 것 (남은 작업)

핵심 제품은 다 됐고, **남은 건 알림 채널 확장 + 모니터링 + 베타 운영**입니다:

- **T-044~T-047 Slack / Discord 알림** ← 지금은 **이메일 알림만** 됨 (`lib/notify/email.ts`).
  Slack 연결 플로우, 메시지 포매팅, Discord Webhook, 알림 발송 통합이 남음.
- **T-031 Sentry 모니터링** — 환경변수 자리만 있고 실제 연동은 안 됨 (`SENTRY_DSN` 비어있음).
- **T-052~T-053 베타 운영** — 베타 사용자 모집 + 피드백 반영 (코딩보다 운영 성격).

> 다음 한 걸음으로 좋은 후보: **T-046 (Discord Webhook)** — Slack보다 간단해서 빠르게 알림 채널을 하나 늘릴 수 있음. 또는 **T-044 Slack 연결**.
> ⚠️ 시작 전에 항상 `git log --oneline`로 최신 상태를 먼저 확인하고, Megan에게 "지금 뭐부터 할지" 물어볼 것.

---

## 7. 💻 새 PC에서 처음 세팅하는 법

1. **설치:** Node.js LTS, pnpm, git, Claude Code (`npm i -g @anthropic-ai/claude-code`)
2. **코드 받기:** `git clone https://github.com/meganseo10-svg/intelligence-news-app.git`
3. **비밀키 넣기:** `.env.local` 파일을 옛 PC에서 복사해 프로젝트 루트에 넣기 (⚠️ GitHub엔 없음 — 비밀이라 일부러 제외됨)
4. **메모리 복원(선택):** 옛 PC의 메모리 파일 3개를 새 PC의 `~/.claude/.../memory/`에 넣으면 더 매끄럽게 이어짐 (없어도 이 파일로 충분)
5. `pnpm install`
6. `pnpm dev` → http://localhost:3000
7. `claude` 실행 후 **"START_HERE.md 읽고 이어서 하자"**

---

*이 파일은 진행될 때마다 갱신하세요 (완료 티켓 추가, 다음 할 일 업데이트). 가장 정확한 진행 로그는 항상 `git log --oneline` 입니다.*
