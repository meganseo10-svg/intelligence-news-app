# 📝 PROMPTS FOR CLAUDE CODE — 복붙용 프롬프트 모음

> 이 파일은 Claude Code에게 그대로 복붙해서 사용할 수 있는 프롬프트 모음입니다.
> 각 티켓을 시작할 때마다 해당 프롬프트를 복붙하세요.

---

## 🎬 시작 프롬프트 (가장 먼저 한 번만)

Claude Code를 처음 실행한 후 다음 메시지를 그대로 복붙:

```
안녕, 너는 풀스택 개발자야. 이 폴더의 사양서 8개를 읽고
Intelligence Daily News App을 같이 만들 거야.

먼저 다음 순서로 문서를 읽고 전체 그림을 파악해줘:
1. 00_README.md (시작점)
2. 01_PRD.md (제품 요구사항)
3. 02_TECH_SPEC.md (기술 스택)
4. 07_TICKETS.md (작업 티켓)

나머지 03~06 문서는 해당 티켓 작업할 때 그때그때 읽으면 돼.

읽고 나서 다음 사항을 확인해줘:
- 전체 53개 티켓이 무엇인지 요약
- 1주차에 해야 할 작업 (T-001~T-016)
- 사전에 준비되어야 할 외부 서비스 키

다 파악했으면 "준비됐어. T-001부터 시작할까?"라고 말해줘.
```

Claude Code가 사양서를 다 읽고 "준비됐어"라고 답하면 다음 프롬프트로 진행.

---

## 📦 1주차 프롬프트

### T-001 · Next.js + Tailwind + shadcn/ui 스캐폴드

```
T-001을 시작하자. 07_TICKETS.md의 T-001 명세대로:

1. pnpm을 사용해서 Next.js 14 (App Router, TypeScript)로 프로젝트 초기화
   - 현재 디렉토리에 설치 (. 사용)
   - Tailwind, ESLint 포함
   - src/ 디렉토리는 사용하지 않음 (--src-dir=false)

2. shadcn/ui 초기화 및 기본 컴포넌트 설치:
   button, input, label, dialog, select, toast, badge, tabs, card

3. 02_TECH_SPEC.md의 폴더 구조대로 디렉토리 생성:
   app/, components/, lib/, db/, supabase/migrations/, scripts/, emails/

4. .gitignore 설정 (.env.local 포함 확인)

5. git init + 첫 commit

완료되면 pnpm dev 실행해서 localhost:3000에서 동작 확인하고,
나에게 결과 알려줘.
```

### T-002 · 환경변수 설정

```
T-002를 시작하자.

1. .env.local 파일을 만들어. 다음 키들을 비워둔 채로 생성:
   - 02_TECH_SPEC.md의 환경변수 명세 참고
   - 모든 키 이름만 적고 값은 비워둠

2. .env.example 파일을 .env.local과 동일하게 만듦 (커밋용)

3. lib/env.ts 파일을 만들어:
   - Zod로 모든 환경변수 검증
   - 누락 시 명확한 에러 메시지
   - 04_LLM_PROMPTS.md나 02_TECH_SPEC.md의 예시 참고

4. 환경변수 값은 내가 직접 입력할게.
   값 입력이 필요한 시점에 나에게 어떤 값을 넣을지 알려줘.

지금 .env.local에 들어갈 값들을 정리해서 보여줘.
```

이 시점에 Claude Code가 키 입력을 요청하면, **QUICK_START.md 1단계에서 받은 키들**을 알려주세요.

### T-003 · Supabase 클라이언트

```
T-003 시작.

1. @supabase/supabase-js @supabase/ssr 설치

2. lib/supabase/ 아래 다음 파일 생성:
   - server.ts (서버 컴포넌트용)
   - client.ts (클라이언트 컴포넌트용)
   - middleware.ts (세션 자동 갱신)

3. 루트의 middleware.ts 작성:
   - 인증 보호 라우트: /feed, /saved, /settings, /onboarding
   - 비로그인 시 /login으로 리다이렉트

Supabase 공식 Next.js SSR 가이드 패턴을 따라줘.
완료되면 알려줘.
```

### T-004 · Vercel 자동 배포

```
T-004 시작.

1. .git이 이미 초기화돼 있는지 확인. GitHub에 push할 준비:
   - GitHub repo URL을 나에게 물어보고 remote add
   - 첫 push: git push -u origin main

2. Vercel CLI는 설치하지 않음. 대신 다음 안내문을 만들어줘:
   - Vercel에서 GitHub repo import 하는 단계
   - Vercel 환경변수 등록 가이드
   - Production + Preview 분리

이 부분은 내가 Vercel 웹에서 직접 진행할게. 안내문만 만들어줘.
완료되면 알려줘.
```

### T-005 · 마이그레이션 SQL 실행

```
T-005 시작. 이 작업은 좀 특수해.

1. 03_DATA_MODEL.sql 파일을 그대로 supabase/migrations/0001_init.sql로 복사

2. 다음 두 가지 방법 중 안내문 작성:
   방법 A) Supabase Dashboard SQL Editor에서 직접 실행
   방법 B) supabase CLI로 실행 (선택)

3. 실행 후 확인 쿼리도 알려줘 (어떤 테이블이 생겼는지 확인하는 SQL)

내가 Supabase Dashboard에서 직접 실행할 거야. 안내문만 만들어줘.
완료되면 알려줘.
```

---

### T-006 · Drizzle ORM 셋업

```
T-006 시작.

1. drizzle-orm postgres 설치, drizzle-kit dev로 설치

2. drizzle.config.ts 작성 (Supabase의 DATABASE_URL 사용)

3. db/schema/ 아래 테이블별 스키마 파일 작성:
   - users.ts (user_profiles)
   - keywords.ts (keyword_groups, keywords)
   - news.ts (news_items, news_clusters, translations)
   - insights.ts (insights, user_news_feed, saved_news)
   - notifications.ts (notification_settings, delivery_channels)
   - shared_links.ts
   - api_usage.ts (api_usage_log)

4. db/index.ts에서 모든 schema를 export하고 Drizzle 인스턴스 생성

5. pgvector는 customType으로 처리:
   - 1536 dimension
   - 03_DATA_MODEL.sql의 vector(1536) 컬럼과 일치

6. pnpm db:studio 명령 추가 (drizzle-kit studio)

완료되면 알려줘.
```

### T-007 · 시드 데이터

```
T-007 시작.

scripts/seed.ts 작성:
- 테스트 사용자 1명 (이메일은 내가 알려줄게)
- 키워드 그룹 4개 (경쟁사/업계/제품/일반)
- 각 그룹마다 키워드 2-3개
- 임시 뉴스 10건 (현실적인 한국어 + 영어 뉴스)
- 멱등성 보장 (재실행해도 중복 없음)

package.json scripts에 "seed": "tsx scripts/seed.ts" 추가.

완료되면 pnpm seed 실행하고 결과 알려줘.
```

### T-008 · Supabase Auth 통합

```
T-008 시작. 인증 시스템 만들자.

1. 로그인 페이지 /login:
   - 이메일+비밀번호 폼
   - Google OAuth 버튼
   - Kakao OAuth 버튼

2. 회원가입 페이지 /signup:
   - 이메일+비밀번호+표시이름
   - 약관 동의 체크박스
   - 회원가입 후 /onboarding/profile로 리다이렉트

3. OAuth callback /auth/callback/route.ts

4. 로그아웃 액션 (서버 액션)

shadcn/ui 컴포넌트 사용하고, 06_UI_SPEC.md의 디자인 시스템 따라줘.

Google/Kakao OAuth는 Supabase Dashboard에서 활성화해야 하니까
가이드만 만들고 코드는 OAuth 버튼 클릭 핸들러까지만 작성.

완료되면 알려줘.
```

### T-009 · USER_PROFILES 자동 생성 확인

```
T-009 시작. 짧은 검증 작업이야.

1. 03_DATA_MODEL.sql에 정의된 handle_new_user 트리거가 Supabase에 적용됐는지 확인
   - Supabase Dashboard에서 SQL Editor로 확인 쿼리 만들어줘

2. 테스트 사용자 만들고 user_profiles row가 자동 생성되는지 확인

3. RLS 정책 확인: 다른 사용자 데이터 조회 불가 테스트

확인 방법을 안내문으로 만들어줘. 내가 Supabase Dashboard에서 직접 검증할게.
```

### T-010 · 기본 레이아웃 + 헤더

```
T-010 시작.

1. app/(app)/layout.tsx — 인증된 사용자용 레이아웃
   - 06_UI_SPEC.md의 헤더 명세대로
   - 로고, 검색 아이콘, 알림 아이콘, 설정 아이콘, 아바타

2. components/layout/Header.tsx 작성:
   - sticky top
   - backdrop blur
   - 모바일 반응형

3. next-themes로 다크모드 토글

4. lucide-react 아이콘 사용

shadcn/ui Dropdown으로 아바타 클릭 시 메뉴(프로필/설정/로그아웃).

완료되면 알려줘.
```

### T-011 · 온보딩 1단계

```
T-011 시작.

1. app/(onboarding)/layout.tsx — 진행바 + 공통 프레임
   - 06_UI_SPEC.md의 온보딩 레이아웃 명세대로

2. app/(onboarding)/profile/page.tsx — 1단계 화면
   - 회원가입에서 받은 이메일 표시
   - 표시 이름 입력만

3. middleware.ts 업데이트:
   - user_profiles.onboarding_completed = false인 사용자는
   - /feed, /saved 등 메인 페이지 접근 시 /onboarding/profile로 리다이렉트

완료되면 알려줘.
```

### T-012 · 온보딩 2단계 (비즈니스 프로필)

```
T-012 시작.

app/(onboarding)/profile/page.tsx 완성:

1. react-hook-form + Zod 설치 (이미 있으면 skip)

2. 06_UI_SPEC.md의 profileSchema 그대로 구현:
   - 회사명 (필수)
   - 업종 (Select)
   - 회사 규모 (Select)
   - 주력 제품 (태그 입력)
   - 타겟 고객 (태그 입력, 선택)

3. 태그 입력 컴포넌트 새로 만듦 (Enter로 추가, X로 삭제)

4. PUT /api/profile API 라우트 작성:
   - 05_API_SPEC.md 명세대로
   - Zod 검증
   - Supabase RLS로 본인 데이터만 수정

5. 타임존 자동 감지:
   Intl.DateTimeFormat().resolvedOptions().timeZone

완료되면 알려줘.
```

### T-013 · 온보딩 3단계 (키워드 등록)

```
T-013 시작. 이 티켓은 좀 커.

1. app/(onboarding)/keywords/page.tsx
   - 06_UI_SPEC.md의 키워드 등록 화면 그대로
   - 4개 그룹 카드 (경쟁사/업계/제품/일반)
   - 각 그룹마다 태그 입력
   - 전체 키워드 최대 30개

2. POST /api/keyword-groups, POST /api/keywords API
   - 05_API_SPEC.md 명세대로

3. "AI 추천 키워드" 버튼 UI만 만들고
   API(/api/keywords/suggest)는 T-025와 함께 구현 (LLM 호출 필요)
   - 일단 버튼은 비활성 + "준비중" 표시

4. 완료 시 user_profiles.onboarding_completed = true 업데이트
   → /feed로 리다이렉트

완료되면 알려줘.
```

### T-014 · 키워드 관리 페이지

```
T-014 시작.

/settings/keywords 페이지:
- 그룹별 키워드 목록 표시
- 그룹 추가/이름 변경/삭제
- 키워드 추가/삭제
- 키워드별 소스 선택 (네이버/GNews/RSS 멀티 셀렉트)
- 활성/비활성 토글

PUT/DELETE API 라우트들도 추가.

완료되면 알려줘.
```

### T-015 · 1주차 통합 테스트

```
T-015 시작. 1주차 마무리 검증이야.

1. 다음 플로우 전체 테스트해서 결과 보고:
   - 회원가입
   - 이메일 인증 (가능하면)
   - 온보딩 1→2→3
   - 키워드 등록 완료
   - /feed 페이지 진입 (뉴스 없음 상태)
   - /settings/keywords에서 키워드 수정

2. 발견된 버그 픽스

3. Git에 모두 commit + push

4. Vercel에 자동 배포되는지 확인

완료되면 알려줘.
```

### T-016 · 1주차 회고

```
T-016 시작.

1. 지금까지 작성된 모든 코드 검토:
   - TypeScript 에러 없는지
   - 사용하지 않는 import 정리
   - console.log 정리

2. 다음 외부 API 키 동작 재확인:
   - Supabase (DB 쿼리 동작)
   - 이외 키는 2주차에 검증

3. README.md 업데이트:
   - 프로젝트 설명
   - 로컬 개발 시작 방법

완료되면 1주차 끝! 2주차 시작 전 잠시 휴식할까.
```

---

## 🤖 2주차 프롬프트 (간략)

### T-017~T-020 (뉴스 수집)

```
T-017 시작.

lib/sources/naver.ts 작성:
- 네이버 검색 API 호출
- 07_TICKETS.md의 T-017 명세대로
- HTML 태그 제거, 본문 추출
- 레이트 리미트 (초당 10건 이하, p-limit 사용)
- 에러 핸들링 + 재시도

NewsItem 인터페이스는 lib/types.ts에 먼저 정의:
- 05_API_SPEC.md의 NewsItem 타입 그대로

테스트 함수도 같이 만들어줘 (특정 키워드로 검색해서 결과 출력).

완료되면 알려줘.
```

```
T-018 시작.

lib/sources/gnews.ts 작성:
- GNews API 호출
- 다국어 지원 (lang 파라미터)
- 무료 한도(일 100건) 관리:
  - api_usage_log에서 오늘 사용량 확인
  - 한도 초과면 빈 배열 반환 + 로그

완료되면 알려줘.
```

```
T-019 시작.

lib/sources/rss.ts 작성:
- rss-parser 설치
- 초기 RSS 피드 5개 등록 (07_TICKETS.md 참고)
- 키워드 매칭 (제목·요약에 포함 여부)
- 일자 필터 (24시간 이내만)

완료되면 알려줘.
```

```
T-020 시작.

lib/sources/index.ts 작성:
- collectForKeyword(keyword, sources[]) 함수
- 세 어댑터 병렬 호출 (Promise.allSettled)
- 한 어댑터 실패가 전체 실패로 번지지 않게
- URL canonical 기준 1차 dedup

완료되면 알려줘.
```

### T-021~T-023 (Dedup + 임베딩)

```
T-021 시작.

lib/dedup.ts에 canonicalizeUrl 함수 추가:
- 쿼리 파라미터 제거 (utm_*, ref, source 등)
- 모바일/PC URL 통합
- 트레일링 슬래시 정리

DB upsert 로직: url_canonical unique key로 ON CONFLICT.

완료되면 알려줘.
```

```
T-022 시작.

lib/embed.ts 작성:
- 04_LLM_PROMPTS.md의 createEmbedding, createEmbeddings 함수 그대로
- OpenAI text-embedding-3-small
- api_usage_log에 비용 기록

완료되면 알려줘.
```

```
T-023 시작.

lib/dedup.ts에 findOrCreateCluster 함수 추가:
- pgvector find_similar_cluster SQL 함수 호출
- 유사도 ≥ 0.88이면 기존 클러스터에 추가
- 없으면 새 클러스터 생성
- news_clusters.news_count 증가

03_DATA_MODEL.sql의 find_similar_cluster 함수가
Supabase에 적용돼 있어야 해. 확인하고 안 돼 있으면 알려줘.

완료되면 알려줘.
```

### T-024~T-027 (LLM 분석)

```
T-024 시작.

@anthropic-ai/sdk 설치.
lib/llm/client.ts 작성:
- 04_LLM_PROMPTS.md의 client 설정 그대로
- 재시도 로직 (exponential backoff)
- api_usage_log 자동 기록

완료되면 알려줘.
```

```
T-025 시작.

1. lib/llm/prompts.ts:
   - 04_LLM_PROMPTS.md의 SYSTEM_PROMPT 그대로
   - buildAnalysisPrompt 함수 그대로
   - buildKeywordSuggestPrompt 함수 그대로
   - buildBodyTranslationPrompt 함수 그대로

2. lib/llm/schema.ts:
   - NewsAnalysisSchema (Zod)
   - KeywordSuggestionSchema (Zod)

3. lib/llm/analyze.ts:
   - analyzeNews(), analyzeNewsWithRetry() 함수
   - 04_LLM_PROMPTS.md 그대로

4. lib/llm/suggest-keywords.ts:
   - 사용자 프로필 받아서 12개 키워드 추천

5. POST /api/keywords/suggest 엔드포인트:
   - 05_API_SPEC.md 명세대로
   - 인증된 사용자의 프로필 자동 조회

6. T-013에서 비활성화했던 "AI 추천 키워드" 버튼 활성화

완료되면 본인 계정으로 추천 키워드 테스트하고 결과 알려줘.
```

```
T-026 시작.

분석 결과 저장 로직 만들자.

1. analyzeNews 결과를 다음 테이블에 분리 저장:
   - insights (사용자별, 시사점)
   - translations (글로벌 캐시)

2. 번역 캐시 hit 시 LLM 호출 스킵:
   - 같은 news_id + target_lang 조합이 이미 있으면 스킵
   - 단, insights는 사용자별로 다르므로 새로 생성

3. 트랜잭션으로 일관성 보장

완료되면 알려줘.
```

```
T-027 시작.

lib/dedup.ts에 shouldSkipForLLM 함수 추가:
- 04_LLM_PROMPTS.md의 사전 필터링 휴리스틱 그대로

완료되면 알려줘.
```

### T-028~T-030 (스케줄러)

```
T-028 시작.

1. vercel.json 작성 (02_TECH_SPEC.md 참고)
2. app/api/cron/collect/route.ts 스켈레톤:
   - Authorization 헤더 검증
   - 일단 빈 응답만

완료되면 알려줘.
```

```
T-029 시작. 이게 가장 큰 티켓이야.

app/api/cron/collect/route.ts 완성:

1. 활성 사용자 조회 (onboarding_completed = true)
2. 사용자 청크별 병렬 처리 (한 번에 5명씩)
3. 각 사용자 처리 흐름:
   a. 활성 키워드 + 소스 조합으로 수집
   b. URL canonical로 1차 dedup
   c. 임베딩 생성 → 클러스터 매칭
   d. 휴리스틱 필터
   e. 통과한 뉴스만 Claude API 호출
   f. insights + translations + user_news_feed 저장
4. 통계 반환 (사용자 수, 수집 건수, 비용 등)

처리 중 로그를 충분히 남겨서 디버깅 가능하게.

완료되면 알려줘.
```

```
T-030 시작.

app/api/admin/trigger/route.ts:
- 관리자 이메일 화이트리스트 검증 (.env에 ADMIN_EMAILS 추가)
- POST 본문에 action: "collect" 받으면 즉시 collect 실행

테스트:
- 본인 계정으로 트리거
- DB에 데이터 쌓이는지 확인

완료되면 알려줘.
```

### T-031~T-033 (모니터링 + 마무리)

```
T-031 시작.

@sentry/nextjs 설치 + 셋업 위저드 실행:
pnpm sentry-wizard

서버·클라이언트 모두 캐치되도록.

완료되면 알려줘.
```

```
T-032 시작.

/admin 페이지 (관리자만):
- 일별 수집 건수, LLM 비용, 활성 사용자
- Recharts로 간단한 차트
- 05_API_SPEC.md의 /api/admin/stats 엔드포인트 같이 만듦

완료되면 알려줘.
```

```
T-033 시작. 2주차 마무리.

1. 본인 계정으로 수동 트리거 실행
2. 영어 뉴스 5건 + 한국어 뉴스 5건 분석 품질 확인
3. 시사점이 "내 회사 관점"인지 검수
4. 발견된 문제 픽스

확인 결과 알려줘.
```

---

## 🎨 3주차 프롬프트 (간략)

3주차는 UI + 알림 + 공유 + 베타 출시. 각 티켓은 07_TICKETS.md에 상세히 정의돼 있어요.

### T-034 (피드 데이터)
```
T-034 시작.

app/(app)/feed/page.tsx Server Component 작성:
- 05_API_SPEC.md의 GET /api/feed 명세대로
- user_news_feed JOIN news_items, insights, translations
- 날짜별 페이지네이션

완료되면 알려줘.
```

### T-035 (뉴스 카드)
```
T-035 시작.

components/feed/NewsCard.tsx:
- 06_UI_SPEC.md의 NewsCard 컴포넌트 그대로
- 배지, 시사점 박스, 액션 바, 번역 토글

완료되면 알려줘.
```

### 이후 T-036 ~ T-053
각 티켓마다 다음 패턴으로 프롬프트:
```
T-XXX 시작.

[07_TICKETS.md의 해당 티켓 명세 그대로 따라줘]
관련 사양은 [05_API_SPEC.md / 06_UI_SPEC.md / 04_LLM_PROMPTS.md] 참고.

완료되면 알려줘.
```

---

## 🆘 막혔을 때 쓰는 프롬프트

### 에러 발생 시
```
다음 에러가 발생했어:

[에러 메시지 그대로 붙여넣기]

1. 무엇이 원인인지 분석해줘
2. 해결책 1개만 제안하고, 그대로 적용해줘
3. 적용 후 같은 에러가 재현되지 않는지 확인해줘
```

### 사양서와 다른 결정이 필요할 때
```
[상황 설명]

사양서에 명확히 정의되지 않은 부분이야.
다음 옵션들을 비교해서, 사양서의 다른 부분과
일관성 있는 결정을 제안해줘:

옵션 A: ...
옵션 B: ...

내가 결정할게.
```

### 코드가 너무 복잡해질 때
```
잠깐, 이 코드 너무 복잡해.

1. 지금 작성한 [파일명]의 [함수명] 함수 다시 봐
2. 한 함수가 하는 일이 너무 많지 않은지 검토
3. 단순화할 방법 제안

YAGNI 원칙 따라서 지금 필요한 것만 남기자.
```

### 사용자 검증이 필요할 때
```
잠깐 멈춰.

[방금 만든 것 요약]

내가 직접 확인하고 다음으로 넘어갈지 결정할게.
- 브라우저에서 무엇을 클릭하고 확인하면 되는지
- 어떤 데이터가 어디에 저장됐는지 확인 방법
- 예상되는 결과

을 알려줘.
```

### 다음 작업 정리
```
지금까지 작업 정리:
- 완료된 티켓:
- 진행 중 티켓:
- 막힌 부분:
- 다음에 할 일:

이걸 README.md 또는 PROGRESS.md에 기록해줘.
```

---

## 💡 일반 팁

### Claude Code가 너무 빠르게 진행할 때
```
잠깐, 너무 빠르게 진행하지 마.
한 티켓 끝내고 나에게 확인 받고 다음으로 넘어가.
지금 T-XXX 하나만 끝내고 멈춰.
```

### Claude Code가 임의 결정할 때
```
이거 사양서에 정의돼 있어.
[관련 사양서 파일명]의 [섹션]을 다시 읽고 그대로 따라줘.
```

### Git commit 자동화
```
지금까지 작업한 거 모두 git commit 해줘.
메시지는 영어로 "T-XXX: [한 줄 요약]" 형식.
한 티켓당 한 commit.
```

---

## 🎯 매일 시작할 때

```
어제까지 작업 정리 보여줘.
지금 진행 중인 티켓이 뭐였지?
오늘 어디서부터 이어가면 돼?
```

위 프롬프트 하나로 어제 컨텍스트 복원 가능.

---

준비됐으면 첫 메시지(맨 위 "시작 프롬프트")부터 시작하세요! 🚀
