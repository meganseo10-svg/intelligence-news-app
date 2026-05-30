# 06. UI Specification

이 문서는 4개 핵심 화면의 상세 디자인 사양입니다.
앞서 합의된 와이어프레임을 기반으로 합니다.

---

## 0. 디자인 시스템

### 0.1 컬러 (Tailwind + shadcn/ui 기본)

```css
/* 라이트 모드 기본 */
--background: #ffffff
--foreground: #0a0a0a
--muted: #f4f4f5
--muted-foreground: #71717a
--border: #e4e4e7
--primary: #18181b
--primary-foreground: #fafafa
--accent: #f4f4f5

/* 다크 모드 */
--background: #09090b
--foreground: #fafafa
--muted: #27272a
--muted-foreground: #a1a1aa
--border: #27272a
```

### 0.2 카테고리 컬러 (배지용)

| 카테고리 | 라이트 BG | 라이트 텍스트 | 다크 BG | 다크 텍스트 |
|---|---|---|---|---|
| 경쟁사 | `#EEEDFE` | `#3C3489` | `#3C3489` | `#CECBF6` |
| 업계 동향 | `#E1F5EE` | `#085041` | `#085041` | `#9FE1CB` |
| 제품·기술 | `#FAEEDA` | `#633806` | `#633806` | `#FAC775` |
| 일반 | `#F1EFE8` | `#444441` | `#444441` | `#D3D1C7` |
| 중요 | `#FCEBEB` | `#791F1F` | `#791F1F` | `#F7C1C1` |

### 0.3 타이포그래피

- 폰트: 시스템 폰트 스택 (한국어: `Apple SD Gothic Neo, Pretendard, ...`)
- 본문: 14~16px, line-height 1.55
- 제목: 22px (h1), 18px (h2), 16px (h3) — font-weight 500
- 라벨: 12px, color muted-foreground

### 0.4 컴포넌트 기본 규칙

- 카드: white bg, `border-radius: 12px`, `border: 0.5px solid border`
- 버튼: 36px 높이, `border-radius: 8px`
- 입력: 38px 높이
- 모서리: 일반 8px, 카드 12px, 모달 16px
- 아이콘: lucide-react, 16~20px

### 0.5 반응형

- 모바일 우선
- 브레이크포인트: sm 640, md 768, lg 1024
- 메인 콘텐츠 최대 너비 720px (모바일 친화적 1열)

---

## 1. 화면 ① — 데일리 피드 (`/feed`)

### 1.1 라우트
- `app/(app)/feed/page.tsx`
- Server Component (초기 데이터 로딩)
- Client component만 필요한 부분 분리

### 1.2 레이아웃 구조

```
┌────────────────────────────────────────┐
│ [헤더] 로고 | 검색 | 알림 | 설정 | 아바타│  ← 고정
├────────────────────────────────────────┤
│ 2026.05.21 (목)                        │
│ 오늘의 인텔리전스         < 5/21 > [↻] │
│ 새 뉴스 14건                            │
├────────────────────────────────────────┤
│ [전체 14] [경쟁사 4] [업계 5] [제품 3] │  ← 스크롤
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐  │
│ │ [중요] [경쟁사]  Reuters · 3h ago│  │
│ │ 오픈AI, 데이브레이크 설립        │  │
│ │ 오픈AI가 AI 기반 보안 위협에...   │  │
│ │ ┌────────────────────────────┐  │  │
│ │ │ 💡 내 비즈니스 시사점        │  │  │
│ │ │ 영업기회: ...               │  │  │
│ │ └────────────────────────────┘  │  │
│ │ [원문][번역][복사][공유] [저장] │  │
│ └──────────────────────────────────┘  │
│ ... (다음 카드)                         │
└────────────────────────────────────────┘
```

### 1.3 헤더 컴포넌트

```typescript
// components/layout/Header.tsx
<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
  <div className="flex h-14 items-center justify-between px-4">
    <Link href="/feed" className="flex items-center gap-2">
      <Logo />
      <span className="font-medium">Intel Daily</span>
    </Link>
    <nav className="flex items-center gap-3 text-muted-foreground">
      <Search className="h-5 w-5" />
      <Bell className="h-5 w-5" />
      <Link href="/settings"><Settings className="h-5 w-5" /></Link>
      <Avatar className="h-7 w-7" />
    </nav>
  </div>
</header>
```

### 1.4 카테고리 탭

```typescript
const tabs = [
  { key: "all", label: "전체", count: 14 },
  { key: "competitor", label: "경쟁사", count: 4 },
  { key: "industry", label: "업계 동향", count: 5 },
  { key: "product", label: "제품·기술", count: 3 },
  { key: "general", label: "일반", count: 2 },
];
```

- 가로 스크롤 (`overflow-x-auto`)
- 활성 탭: `border-foreground bg-background`
- 비활성: `bg-muted text-muted-foreground`

### 1.5 뉴스 카드 컴포넌트

```typescript
// components/feed/NewsCard.tsx
interface NewsCardProps {
  feedItem: FeedItem;
  onCopy: () => void;
  onShare: () => void;
  onSave: () => void;
  onToggleTranslation: () => void;
}

export function NewsCard({ feedItem, ... }: NewsCardProps) {
  return (
    <article className="rounded-xl border bg-background p-4">
      {/* 배지 + 메타 */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {feedItem.insight.importance_score >= 0.8 && (
          <Badge variant="important">중요</Badge>
        )}
        <Badge category={feedItem.insight.category}>
          {categoryLabel(feedItem.insight.category)}
        </Badge>
        <span className="text-xs text-muted-foreground">
          {feedItem.news.publisher} · {relativeTime(feedItem.news.published_at)}
        </span>
        {feedItem.news.original_lang !== "ko" && (
          <Badge variant="translation" className="ml-auto">
            <Languages className="h-3 w-3 mr-1" />
            {feedItem.news.original_lang.toUpperCase()}→KO
          </Badge>
        )}
      </div>

      {/* 제목 */}
      <h3 className="text-base font-medium leading-snug mb-1.5">
        {showOriginal ? feedItem.news.title_original : feedItem.news.title_translated}
      </h3>

      {/* 요약 */}
      <p className="text-sm text-muted-foreground leading-relaxed mb-3">
        {showOriginal ? feedItem.news.summary_original : feedItem.news.summary_translated}
      </p>

      {/* 시사점 박스 */}
      <div className="rounded-lg bg-muted p-3 mb-3">
        <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
          <Lightbulb className="h-3 w-3" />
          내 비즈니스 시사점
        </div>
        <div className="text-sm leading-relaxed">
          <span className="text-muted-foreground">영업 기회:</span>{" "}
          {feedItem.insight.sales_opportunity}
        </div>
        {feedItem.insight.target_customer && (
          <div className="text-sm leading-relaxed mt-1">
            <span className="text-muted-foreground">타겟:</span>{" "}
            {feedItem.insight.target_customer}
          </div>
        )}
      </div>

      {/* 액션 바 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <button onClick={() => window.open(feedItem.news.url)}>
          <ExternalLink className="h-3.5 w-3.5 inline mr-1" />원문
        </button>
        <button onClick={onToggleTranslation}>
          <Languages className="h-3.5 w-3.5 inline mr-1" />
          {showOriginal ? "번역 보기" : "원문 보기"}
        </button>
        <button onClick={onCopy}>
          <Copy className="h-3.5 w-3.5 inline mr-1" />복사
        </button>
        <button onClick={onShare}>
          <Share2 className="h-3.5 w-3.5 inline mr-1" />공유
        </button>
        <button onClick={onSave} className="ml-auto">
          <Bookmark className={`h-3.5 w-3.5 inline mr-1 ${
            feedItem.is_saved ? "fill-current" : ""
          }`} />
          {feedItem.is_saved ? "저장됨" : "저장"}
        </button>
      </div>
    </article>
  );
}
```

### 1.6 복사 액션

```typescript
function buildCopyText(feedItem: FeedItem): string {
  return `${feedItem.news.title_translated}

${feedItem.news.summary_translated}

💡 시사점: ${feedItem.insight.sales_opportunity}

원문: ${feedItem.news.url}
${feedItem.news.publisher} · ${formatDate(feedItem.news.published_at)}`;
}

await navigator.clipboard.writeText(buildCopyText(feedItem));
toast.success("복사되었습니다");
```

---

## 2. 화면 ② — 온보딩 (`/onboarding/profile`, `/keywords`, `/notifications`)

### 2.1 라우트
- `app/(onboarding)/profile/page.tsx`
- `app/(onboarding)/keywords/page.tsx`
- `app/(onboarding)/notifications/page.tsx`

회원가입 직후 자동 진입. `user_profiles.onboarding_completed = true` 될 때까지 다른 페이지 접근 차단 (미들웨어).

### 2.2 공통 레이아웃

```typescript
<OnboardingLayout step={2} totalSteps={3}>
  {/* 진행바 */}
  <ProgressBar current={step} total={totalSteps} />
  <h1>제목</h1>
  <p className="text-sm text-muted-foreground">설명</p>

  {/* 폼 */}
  ...

  {/* 하단 버튼 */}
  <div className="flex justify-between">
    <Button variant="ghost">이전</Button>
    <Button>다음: 알림 설정</Button>
  </div>
</OnboardingLayout>
```

### 2.3 Step 1 — 계정 정보 (자동)
- 회원가입에서 이미 받은 이메일 표시
- 표시 이름 입력만

### 2.4 Step 2 — 비즈니스 프로필

```typescript
const profileSchema = z.object({
  company: z.string().min(1, "회사명을 입력하세요"),
  industry: z.string().min(1),
  company_size: z.enum(["1-10", "11-50", "51-200", "201-1000", "1000+"]),
  products: z.array(z.string()).min(1, "최소 1개 제품을 추가하세요"),
  target_customers: z.array(z.string()).optional(),
});
```

- 업종: Select (사전 정의 옵션 + "기타" 직접 입력)
- 회사 규모: Select
- 주력 제품: 태그 입력 (Enter로 추가, X로 삭제)
- 타겟 고객: 태그 입력 (선택)

### 2.5 Step 3 — 키워드 등록

4개 그룹 카드를 세로로 나열:

```typescript
const groupCategories = [
  { key: "competitor", label: "경쟁사", icon: Target, color: "purple" },
  { key: "industry", label: "업계 동향", icon: ChartBar, color: "teal" },
  { key: "product", label: "제품·기술", icon: Package, color: "amber" },
  { key: "general", label: "일반", icon: Newspaper, color: "gray" },
];
```

각 카드 안:
- 추가된 키워드: 컬러 칩 (X로 삭제 가능)
- "+ 추가" 점선 칩 (클릭 시 입력 필드 등장)
- 키워드는 최대 30개 전체 제한

AI 추천 키워드:
- "AI 추천: 입력하신 정보 기반 12개 키워드 제안" 카드
- 클릭 → 모달 → 4그룹별 3개씩 표시 → 원하는 것만 체크해서 추가

### 2.6 Step 완료 시

```typescript
await fetch("/api/profile", {
  method: "PUT",
  body: JSON.stringify({ ..., onboarding_completed: true }),
});
router.push("/feed");
```

---

## 3. 화면 ③ — 알림 설정 (`/settings/notifications`)

### 3.1 라우트
- `app/(app)/settings/notifications/page.tsx`

### 3.2 섹션 구조

```
┌─────────────────────────────────────┐
│ ← 알림 설정                          │
├─────────────────────────────────────┤
│ [알림 주기]                          │
│  ● 데일리      매일 지정 시각에 한 번│
│  ○ 위클리      요일·시각 선택        │
│  ○ 긴급만      중요도 0.8 이상        │
├─────────────────────────────────────┤
│ [수신 시각]                          │
│  [아침 07:00] [출근 08:30] [점심] [직접]│
│  ⏰ 타임존: Asia/Seoul (자동)         │
├─────────────────────────────────────┤
│ [수신 채널]                          │
│  📱 인앱 피드          [●○ ON]      │
│  📧 이메일 [활성]      [●○ ON]      │
│     kc@cyberdigm.co.kr               │
│  💬 Slack #intel-news  [●○ ON]      │
│  💬 Discord           [○● OFF]      │
│  💬 카카오 알림톡 [준비중]            │
├─────────────────────────────────────┤
│ [표시 옵션]                          │
│  해외 뉴스 자동 번역    [●○ ON]      │
│  원문 우선 표시          [○● OFF]    │
│  중복 사건 묶기          [●○ ON]      │
└─────────────────────────────────────┘
```

### 3.3 채널 연결 플로우

#### 이메일
- 회원가입 시 자동 등록 (기본 채널)

#### Slack
- 모달 열림 → 안내문:
  > "Slack에서 Incoming Webhook을 생성하고 URL을 붙여넣어주세요."
  > [Slack 가이드 보기]
- URL 입력 + "테스트 발송" 버튼
- 성공 시 채널명 자동 추출 (사용자가 직접 입력해도 됨)

#### Discord
- 동일 패턴, URL만

### 3.4 시각 직접 선택

```typescript
<TimePicker
  value={settings.send_time}
  min="05:30"
  max="23:59"
  step={15} // 15분 단위
/>
```

### 3.5 저장

자동 저장 (각 토글/입력 변경 시 PUT 호출, debounce 500ms) 또는 명시적 저장 버튼.
MVP는 명시적 저장 버튼 권장 (실수 방지).

---

## 4. 화면 ④ — 공유 모달

### 4.1 컴포넌트
- `components/feed/ShareModal.tsx`
- shadcn/ui Dialog 사용

### 4.2 구조

```
┌─────────────────────────────────┐
│ 공유                          ✕  │
├─────────────────────────────────┤
│ 공유 대상                        │
│ 오픈AI, 데이브레이크 설립       │
│ Reuters · 2026.05.21             │
├─────────────────────────────────┤
│ 포함할 내용                      │
│ ☑ 제목·요약                    │
│ ☑ 원문 URL                      │
│ ☑ 비즈니스 시사점               │
│ ☐ 내 메모 함께 보내기            │
├─────────────────────────────────┤
│ 공유 방식                        │
│ [복사] [링크] [메일] [카톡]      │
│ [Slack] [PDF] [Notion] [더보기]  │
├─────────────────────────────────┤
│ 공개 링크 옵션                   │
│ 🔗 intel.app/s/k2Jf9aQ  [복사]   │
│ [24시간] [7일] [30일] [무기한]    │
└─────────────────────────────────┘
```

### 4.3 공유 방식별 동작

| 버튼 | 동작 |
|---|---|
| 복사 | `navigator.clipboard.writeText()` |
| 링크 | `/api/shared-links` 호출 → 토큰 URL 생성 → 복사 |
| 메일 | `mailto:` 링크 (제목 + 본문 미리 채워서) |
| 카톡 | 모바일에서 `navigator.share()` 호출 (Web Share API) |
| Slack | 사용자 연결된 Slack에 직접 발송 |
| PDF | 백엔드에서 PDF 생성 (베타 이후) |
| Notion | "Notion에 복사 가능한 형식으로 클립보드 복사" |
| 더보기 | `navigator.share()` 네이티브 다이얼로그 |

### 4.4 공개 링크 만료

```typescript
const expiryOptions = [
  { value: "24h", label: "24시간" },
  { value: "7d", label: "7일" },
  { value: "30d", label: "30일" },
  { value: "never", label: "무기한" },
];
```

선택 변경 시 즉시 API 호출하여 새 토큰 생성 (또는 기존 토큰 만료일 업데이트).

### 4.5 공개 페이지 (`/s/[token]`)

```typescript
// app/s/[token]/page.tsx
// 인증 불필요
export default async function SharedPage({ params }) {
  const data = await fetch(`/api/shared-links/public/${params.token}`).then(r => r.json());

  if (!data || isExpired(data.expires_at)) {
    return <ExpiredPage />;
  }

  return (
    <SharedNewsView
      news={data.news}
      insight={data.include_insights ? data.insight : null}
      userNote={data.user_note}
      sharedBy={data.shared_by_name}
    />
  );
}
```

- OG 메타태그 풍성하게 (카톡 공유 시 미리보기)
- "Intel Daily에서 받기" CTA → 가입 유도

---

## 5. 모바일 반응형 체크리스트

- [ ] 모든 터치 영역 ≥ 44px
- [ ] iOS Safari 100vh 이슈 처리 (`100dvh` 사용)
- [ ] 가로 스크롤 발생 X (카테고리 탭 제외)
- [ ] 입력 필드 자동 줌인 방지 (`font-size: 16px+`)
- [ ] 모달은 하단 시트(bottom sheet) 패턴 (모바일에서)
- [ ] 카드 옆 패딩 최소 16px

---

## 6. PWA 지원

- `public/manifest.json` 작성
- 아이콘: 192x192, 512x512 (필수)
- `theme_color`, `background_color` 정의
- 서비스 워커: Next.js + Workbox (선택, 베타 이후)

```json
{
  "name": "Intelligence Daily",
  "short_name": "Intel Daily",
  "start_url": "/feed",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#18181b",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 7. 추가 화면 (MVP 외 참고)

- `/saved` — 저장한 뉴스 목록
- `/settings/profile` — 프로필 수정
- `/settings/keywords` — 키워드 관리
- `/admin` — 관리자 대시보드 (개발자 본인용)
- `/` — 랜딩 페이지 (베타 모집)
- `/login`, `/signup` — 인증 화면
