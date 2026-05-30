# Intelligence Daily News App

매일 아침, **내 비즈니스 관점**으로 분석된 뉴스 브리핑을 받아보는 정보 큐레이션 웹앱.
사용자의 회사 프로필·키워드를 기반으로 국내외 뉴스를 수집·번역·요약하고, "우리 회사에
어떤 의미인지(시사점)"까지 AI가 정리해 매일 전달합니다.

## 기술 스택

- **Next.js 14** (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Supabase** (PostgreSQL · Auth · RLS · pgvector) + **Drizzle ORM**
- **Anthropic Claude** (분석) · **OpenAI Embeddings** (의미 중복 제거)
- 뉴스 소스: 네이버 검색 API · GNews · RSS
- 발송: Resend(이메일) · Slack · Discord
- 배포: Vercel (+ Vercel Cron)

## 로컬 개발 시작

```bash
# 1) 의존성 설치
pnpm install

# 2) 환경변수 설정: .env.example 를 복사해 값 채우기
cp .env.example .env.local
#   필수(1주차): NEXT_PUBLIC_SUPABASE_URL / ANON / SERVICE_ROLE,
#                ANTHROPIC_API_KEY, DATABASE_URL, CRON_SECRET, NEXT_PUBLIC_APP_URL

# 3) DB 스키마: supabase/migrations/0001_init.sql 을
#    Supabase 대시보드 SQL Editor에서 한 번 실행

# 4) (선택) 테스트 데이터 시드
pnpm seed

# 5) 개발 서버
pnpm dev   # http://localhost:3000
```

> 로그인 테스트 계정(시드): `test@intelligence.local` / `test1234!`

## 주요 스크립트

| 명령             | 설명                          |
| ---------------- | ----------------------------- |
| `pnpm dev`       | 개발 서버                     |
| `pnpm build`     | 프로덕션 빌드 (타입체크 포함) |
| `pnpm lint`      | ESLint                        |
| `pnpm format`    | Prettier 정리                 |
| `pnpm seed`      | 테스트 데이터 삽입 (멱등)     |
| `pnpm db:studio` | Drizzle Studio (DB GUI)       |

## 폴더 구조 (요약)

```
app/            # 라우트 (auth · onboarding · (app) · api)
components/     # UI · layout · onboarding · settings
lib/            # supabase · actions · env · utils
db/             # Drizzle 스키마 + 인스턴스
supabase/       # 마이그레이션 SQL
docs/           # 제품·기술 사양서 (00~07)
```

## 진행 상황 (MVP, 총 53 티켓)

- **1주차 — 기초 인프라**: T-001~003, 005~014 완료 ✅
  - 프로젝트 셋업 · 환경변수 · Supabase 연동 · DB 스키마 · Drizzle · 시드
  - 인증(로그인/회원가입) · RLS 검증 · 헤더/다크모드
  - 온보딩(프로필+키워드) · 키워드 관리
  - T-004(Vercel 자동 배포)는 보류 — 추후 진행
- **2주차** — 뉴스 수집 + AI 분석 (T-017~033)
- **3주차** — 피드 UI + 알림 + 공유 + 베타 (T-034~053)

자세한 작업 명세는 `docs/07_TICKETS.md` 참고.
