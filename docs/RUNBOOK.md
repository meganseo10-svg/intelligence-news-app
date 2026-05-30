# 운영 런북 (RUNBOOK)

Intelligence Daily 운영 시 장애·이슈 대응 가이드.

## 0. 빠른 점검

- **관리자 대시보드** `/admin` — 활성 사용자, 오늘 수집/비용/에러 한눈에.
- **DB 직접 확인**: `pnpm db:studio` 또는 Supabase Dashboard → Table Editor.
- **수동 수집/발송**: `POST /api/admin/trigger` (관리자 이메일 로그인 상태)
  - 수집: `{ "action": "collect", "scope": "me" | "all" }`
  - 발송: `{ "action": "send", "to": "이메일(선택)" }`

## 1. Cron이 안 돌 때 (새벽 수집/발송 누락)

- **확인**: Vercel → 프로젝트 → Cron / Logs 에서 `/api/cron/collect`, `/api/cron/send-daily` 실행 여부.
- **인증 실패(401)**: Vercel 환경변수 `CRON_SECRET`이 `.env.local`과 같은지 확인.
- **타임아웃**: 함수 `maxDuration=60s`. 사용자/항목이 많으면 `runCollectForAllUsers`의 `chunkSize`·`maxItemsPerUser`를 낮추거나 플랜 상향.
- **수동 복구**: 관리자 트리거로 즉시 수집/발송.

## 2. LLM(분석) 실패

- 현재 분석 LLM은 **OpenAI gpt-4o-mini** (`lib/llm/complete.ts`). Anthropic 크레딧 생기면 이 파일만 Claude로 교체.
- **429/quota**: OpenAI 잔액 확인(platform.openai.com → Billing). 충전.
- **분석 결과 null**: `analyzeNewsWithRetry`가 2회 재시도 후 건너뜀. `api_usage_log`에 `status='error'` 기록 → `/admin` 에러 수로 확인.
- **품질 저하**: `lib/llm/prompts.ts`의 SYSTEM_PROMPT 조정, temperature 변경.

## 3. 외부 뉴스 API 한도

- **GNews**: 무료 일 100건 + 초당 제한. 초과 시 빈 배열 반환(격리됨, 다른 소스는 계속). `api_usage_log`의 `source='gnews'`로 사용량 추적.
- **네이버**: 일 25,000건. 초과 시 429 → 재시도 로직이 흡수.
- 한 소스가 죽어도 `Promise.allSettled`로 전체 수집은 계속됨.

## 4. 이메일 발송 실패 (Resend)

- 테스트 발신자 `onboarding@resend.dev`는 **Resend 계정 소유 이메일로만** 배달. 실제 운영은 **도메인 인증** 후 `RESEND_FROM_EMAIL`을 자체 도메인으로 변경.
- 실패 로그: `api_usage_log`의 `source='resend_email'`, `status='error'`.

## 5. DB 백업 / 복구

- Supabase가 자동 일일 백업(플랜별). Dashboard → Database → Backups.
- 스키마 변경은 `supabase/migrations/`에 SQL로 관리. 재적용 시 기존 객체 DROP 주의.
- 중요 운영 전 수동 백업 권장.

## 6. RLS / 보안

- 모든 사용자 데이터는 RLS로 격리(본인만 조회). 신규 테이블 추가 시 RLS 정책 필수.
- 시크릿(`SUPABASE_SERVICE_ROLE_KEY`, API 키)은 `.env.local`/Vercel 환경변수만. 노출 의심 시 즉시 rotate.

## 7. 자주 쓰는 명령

```bash
pnpm dev            # 로컬 개발
pnpm build          # 프로덕션 빌드(타입체크)
pnpm db:studio      # DB GUI
pnpm seed           # 테스트 데이터
```
