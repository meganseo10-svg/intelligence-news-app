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

- **사양서(읽기 전용, 진실의 원천, 12개 문서):**
  `Desktop\업무\AI\files\intelligence-news-app-spec\intelligence-news-app\`
  - 먼저 읽기: `00_README.md`, `07_TICKETS.md` (53개 티켓 T-001~T-053), `REFERENCE_CODE_T001_T005.md`
  - ⚠️ 이 사양서 폴더는 새 PC에 없을 수 있음 → 없으면 Megan에게 "사양서 폴더 위치 알려달라" 요청.
- **프로젝트 코드:** `Desktop\intelligence-news-app\` (이 저장소)
- **GitHub(비공개):** https://github.com/meganseo10-svg/intelligence-news-app
- **진행 방식:** `07_TICKETS.md`의 티켓을 순서대로(T-001, T-002…) 하나씩.

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

## 5. ✅ 완료한 것 (1주차 — 완료)

- **T-001** Next.js 스캐폴드 (localhost:3000 동작)
- **T-002** `.env.local` + `lib/env.ts` (Supabase 키 검증됨)
- **T-003** Supabase 클라이언트(server/client) + `proxy.ts` 인증 보호 (로그아웃 시 `/feed`→`/login` 리다이렉트 확인)
- **T-005** DB 마이그레이션 (`03_DATA_MODEL.sql` 실행 → 13개 표 + pgvector + RLS + 트리거)
- **T-006** Drizzle ORM (`db/schema/*.ts` 13개 표, `db/index.ts`, `drizzle.config.ts`, 연결 검증)
- **T-008** 로그인/회원가입 화면 (react-hook-form + zod) + OAuth 버튼 + `/auth/callback` + `/auth/signout`
- **T-009** 가입 시 `user_profiles` 자동 생성(`handle_new_user` 트리거) 검증
- **T-011~013** 온보딩(회사정보 → 키워드) + `/feed` 빈 화면 + `app/(app)` 레이아웃
  - API: `/api/profile`(GET/PUT), `/api/keyword-groups`(GET/POST), `/api/keywords`(POST)
  - 재사용 컴포넌트: `components/onboarding/TagInput.tsx`
  - ✅ 실제 브라우저에서 **가입 → 온보딩 → 피드** 전체 흐름 동작 확인 완료
- 참고: `display_name`은 가입 시 auth `user_metadata`에 저장(user_profiles엔 컬럼 없음).

### ⏭️ 일부러 건너뛴 것
- **T-004** Vercel 배포 (GitHub 푸시만 함, Vercel 연결은 나중)
- **T-007** 시드 데이터 (피드 UI 만들 때 같이)
- **T-010** 풀 헤더 (지금은 간단 버전)
- T-013의 "AI 추천 키워드" 버튼 (LLM 필요 → T-025와 함께)

---

## 6. 🔜 다음 할 일 — 2주차 (뉴스 수집 + AI 처리)

**먼저 Megan이 발급해야 할 추가 API 키** (발급 후 `.env.local`에 추가):
- 네이버 검색 API (Client ID / Secret)
- GNews API Key
- OpenAI API Key (임베딩용)
- Anthropic API Key (Claude 분석용)

**티켓 순서:**
T-017 네이버 어댑터 → T-018 GNews → T-019 RSS → T-020 통합수집 → T-021 URL 중복제거 → T-022 임베딩 → T-023 pgvector 중복제거 → T-024 Claude 클라이언트 → T-025 분석 프롬프트 → …

> 다음 한 걸음으로 좋은 후보: **T-017 (네이버 뉴스 어댑터)**. 시작 전에 Megan에게 네이버 검색 API 키 발급을 부탁할 것.
> 또는 UI 먼저 원하면 T-010(헤더) / T-014(키워드 설정 페이지)도 가능.

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

*이 파일은 진행될 때마다 갱신하세요 (완료 티켓 추가, 다음 할 일 업데이트). 자세한 진행 로그는 `PROGRESS.md`에도 있습니다.*
