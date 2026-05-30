# 05. API Specification

이 문서는 Next.js API Routes의 모든 엔드포인트 명세입니다.

---

## 0. 공통 규칙

### 0.1 인증
- 모든 사용자 API는 Supabase Auth 세션 쿠키로 인증
- Cron API는 `Authorization: Bearer ${CRON_SECRET}` 헤더 검증

### 0.2 응답 형식
모든 응답은 JSON. 에러는 다음 구조:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "사용자에게 보여줄 에러 메시지",
    "details": { ... }
  }
}
```

### 0.3 에러 코드
- `UNAUTHORIZED` (401) — 로그인 안 됨
- `FORBIDDEN` (403) — 권한 없음
- `VALIDATION_ERROR` (400) — 입력 검증 실패
- `NOT_FOUND` (404)
- `RATE_LIMITED` (429)
- `INTERNAL_ERROR` (500)
- `EXTERNAL_API_ERROR` (502) — 외부 API 실패

---

## 1. 인증 (Supabase Auth가 처리, 명세 생략)

Supabase Auth Helpers가 자동 처리:
- `/login`, `/signup` 페이지에서 직접 호출
- OAuth callback은 `/auth/callback`

---

## 2. 사용자 프로필

### GET `/api/profile`

**Auth**: Required

**Response 200**:
```json
{
  "user_id": "uuid",
  "company": "사이버다임",
  "industry": "B2B SaaS · 문서보안",
  "company_size": "50-200",
  "products": ["문서중앙화", "DRM", "DLP"],
  "target_customers": ["금융권", "공공기관"],
  "timezone": "Asia/Seoul",
  "preferred_lang": "ko",
  "onboarding_completed": true
}
```

### PUT `/api/profile`

**Auth**: Required

**Request Body**:
```json
{
  "company": "string",
  "industry": "string",
  "company_size": "string",
  "products": ["string"],
  "target_customers": ["string"],
  "timezone": "string",
  "preferred_lang": "ko" | "en"
}
```

**Response 200**: 업데이트된 프로필 객체

---

## 3. 키워드 관리

### GET `/api/keyword-groups`

**Auth**: Required

**Response 200**:
```json
{
  "groups": [
    {
      "id": "uuid",
      "category": "competitor",
      "name": "경쟁사",
      "keywords": [
        {
          "id": "uuid",
          "term": "마크애니",
          "sources": ["naver", "gnews"],
          "language": "auto",
          "is_active": true
        }
      ]
    }
  ]
}
```

### POST `/api/keyword-groups`

**Request Body**:
```json
{
  "category": "competitor" | "industry" | "product" | "general",
  "name": "string"
}
```

### POST `/api/keywords`

**Request Body**:
```json
{
  "group_id": "uuid",
  "term": "string",
  "sources": ["naver", "gnews", "rss"],
  "language": "ko" | "en" | "auto"
}
```

### DELETE `/api/keywords/[id]`

### POST `/api/keywords/suggest`

AI 추천 키워드 (12개) 받기.

**Auth**: Required (프로필 정보 자동 사용)

**Response 200**:
```json
{
  "suggestions": {
    "competitor": ["마크애니", "이스트소프트", "지란지교"],
    "industry": ["문서보안 시장", "DLP 트렌드", "AI 보안"],
    "product": ["문서중앙화", "제로트러스트", "DRM"],
    "general": ["개인정보보호법", "사이버보안 정책", "기업 보안 사고"]
  }
}
```

---

## 4. 데일리 피드

### GET `/api/feed`

**Auth**: Required

**Query**:
- `date`: `YYYY-MM-DD` (default: today)
- `category`: `competitor` | `industry` | `product` | `general` | `all`
- `q`: 검색어 (선택)
- `limit`: default 20
- `offset`: default 0

**Response 200**:
```json
{
  "date": "2026-05-21",
  "total": 14,
  "categories": {
    "competitor": 4,
    "industry": 5,
    "product": 3,
    "general": 2
  },
  "items": [
    {
      "feed_id": "uuid",
      "news": {
        "id": "uuid",
        "url": "https://...",
        "publisher": "Reuters",
        "publisher_domain": "reuters.com",
        "original_lang": "en",
        "title_original": "OpenAI launches...",
        "title_translated": "오픈AI, 데이브레이크 설립",
        "summary_translated": "오픈AI가 ...",
        "thumbnail_url": "https://...",
        "published_at": "2026-05-21T03:14:00Z",
        "cluster_news_count": 4
      },
      "insight": {
        "category": "경쟁사·기술 동향",
        "relevance_score": 0.78,
        "importance_score": 0.85,
        "sales_opportunity": "...",
        "target_customer": "...",
        "risk_signal": "...",
        "tags": ["AI 보안", "OpenAI"],
        "recommended_action": "주간 영업회의 안건"
      },
      "is_read": false,
      "is_saved": false
    }
  ]
}
```

### POST `/api/feed/[feed_id]/read`

읽음 표시.

---

## 5. 번역

### GET `/api/news/[news_id]/translation?lang=ko`

캐시에서 번역 조회. 없으면 자동 생성 후 캐시.

**Response 200**:
```json
{
  "news_id": "uuid",
  "target_lang": "ko",
  "title_translated": "...",
  "summary_translated": "...",
  "body_translated": "..."
}
```

### POST `/api/news/[news_id]/translate-body`

본문 전체 번역 (lazy, 사용자 클릭 시).

**Response 200**: 위와 동일 (body_translated 포함)

---

## 6. 북마크 (저장한 뉴스)

### POST `/api/saved`

```json
{
  "news_id": "uuid",
  "user_note": "string (optional)"
}
```

### DELETE `/api/saved/[news_id]`

### GET `/api/saved`

**Query**: `limit`, `offset`

**Response 200**: 저장한 뉴스 목록 (피드와 동일 구조 + `user_note`, `saved_at`)

### PUT `/api/saved/[news_id]/note`

```json
{
  "user_note": "string"
}
```

---

## 7. 알림 설정

### GET `/api/notification-settings`

**Response 200**:
```json
{
  "frequency": "daily",
  "send_time": "08:30:00",
  "days_of_week": [1, 2, 3, 4, 5],
  "urgent_threshold": 0.8,
  "auto_translate": true,
  "show_original_first": false,
  "group_clusters": true
}
```

### PUT `/api/notification-settings`

위와 동일 구조.

### GET `/api/delivery-channels`

```json
{
  "channels": [
    {
      "id": "uuid",
      "channel_type": "email",
      "config": { "email": "kc@cyberdigm.co.kr" },
      "is_active": true,
      "last_used_at": "2026-05-21T08:30:00Z"
    },
    {
      "id": "uuid",
      "channel_type": "slack",
      "config": { "webhook_url": "https://hooks.slack.com/...", "channel_name": "#intel-news" },
      "is_active": true
    }
  ]
}
```

### POST `/api/delivery-channels`

```json
{
  "channel_type": "email" | "slack" | "discord",
  "config": {
    // email: { "email": "string" }
    // slack: { "webhook_url": "string", "channel_name": "string" }
    // discord: { "webhook_url": "string" }
  }
}
```

### PUT `/api/delivery-channels/[id]`

is_active 토글, config 수정.

### POST `/api/delivery-channels/[id]/test`

테스트 메시지 발송.

---

## 8. 공유

### POST `/api/shared-links`

```json
{
  "scope": "single_news" | "daily_digest",
  "resource_id": "uuid",
  "include_insights": true,
  "user_note": "string (optional)",
  "expires_in": "24h" | "7d" | "30d" | "never"
}
```

**Response 200**:
```json
{
  "token": "k2Jf9aQ",
  "url": "https://app.com/s/k2Jf9aQ",
  "expires_at": "2026-05-28T00:00:00Z"
}
```

### GET `/api/shared-links/public/[token]`

공개 (인증 불필요). 만료 검증 + view_count 증가.

**Response 200**: 공유된 자원 데이터

### DELETE `/api/shared-links/[id]`

본인 링크 삭제.

---

## 9. Cron 엔드포인트

### POST `/api/cron/collect`

**Auth**: `Authorization: Bearer ${CRON_SECRET}`

매일 새벽 05:00 KST (UTC 20:00). 전체 사용자 뉴스 수집 + AI 분석 + 피드 적재.

처리 흐름:
1. 활성 사용자 조회
2. 사용자별 키워드 → 소스별 수집 (병렬, 청크)
3. URL dedup → 임베딩 생성 → 의미 dedup
4. 휴리스틱 필터링
5. Claude API 호출 (사용자별 시사점 + 글로벌 번역)
6. `user_news_feed` 적재
7. 결과 요약 반환

**Response 200**:
```json
{
  "ok": true,
  "duration_ms": 2143000,
  "stats": {
    "users_processed": 30,
    "news_collected": 850,
    "news_after_dedup": 320,
    "news_analyzed": 180,
    "feed_items_created": 540,
    "llm_cost_usd": 2.34
  }
}
```

### POST `/api/cron/send-daily`

**Auth**: `Authorization: Bearer ${CRON_SECRET}`

매일 06:30 KST + 15분 간격으로 다음 시각 사용자에게 발송. (또는 매 30분마다 호출되어 현재 시각에 매칭되는 사용자에게 발송)

처리 흐름:
1. 현재 시각 (KST) 계산
2. `notification_settings.send_time`이 ±15분 이내인 활성 사용자 조회
3. 각 사용자의 `delivery_channels` 활성 채널마다 발송
4. 발송 로그 저장

---

## 10. 관리자 (개발용)

### POST `/api/admin/trigger`

**Auth**: 관리자 본인만 (이메일 화이트리스트)

수동 트리거. Cron 기다리지 않고 즉시 실행.

**Request Body**:
```json
{
  "action": "collect" | "send" | "analyze_news",
  "user_id": "uuid (optional, 특정 사용자만)",
  "news_id": "uuid (action=analyze_news일 때)"
}
```

### GET `/api/admin/stats`

**Auth**: 관리자만

운영 대시보드용 통계.

```json
{
  "users_total": 30,
  "users_active_7d": 18,
  "feed_items_today": 540,
  "llm_cost_today_usd": 2.34,
  "llm_cost_month_usd": 64.20,
  "errors_today": 3
}
```

---

## 11. 타입 정의 (TypeScript)

`lib/types.ts`에 공통 타입 정리:

```typescript
export interface NewsItem {
  id: string;
  url: string;
  url_canonical: string;
  publisher: string;
  publisher_domain: string | null;
  original_lang: string;
  title_original: string;
  body_original: string | null;
  thumbnail_url: string | null;
  published_at: string;
  collected_at: string;
  source: "naver" | "gnews" | "rss" | "manual";
  cluster_id: string | null;
}

export interface Insight {
  id: string;
  news_id: string;
  user_id: string;
  category: string;
  relevance_score: number;
  importance_score: number;
  sales_opportunity: string;
  target_customer: string;
  risk_signal: string;
  tags: string[];
  recommended_action: string;
}

export interface Translation {
  news_id: string;
  target_lang: string;
  title_translated: string;
  summary_translated: string;
  body_translated: string | null;
}

export type DeliveryChannelType = "email" | "slack" | "discord" | "kakao";

export interface DeliveryChannelConfig {
  email?: { email: string };
  slack?: { webhook_url: string; channel_name?: string };
  discord?: { webhook_url: string };
}

export type NotificationFrequency = "daily" | "weekly" | "urgent_only";
```

---

## 12. Rate Limiting (Production)

Vercel Edge Middleware 또는 Upstash Redis로 구현:
- 일반 API: 사용자당 60 req/min
- LLM 호출 API: 사용자당 10 req/min
- 공개 공유 페이지: IP당 30 req/min

MVP 단계는 생략 가능. 베타 직전에 추가.
