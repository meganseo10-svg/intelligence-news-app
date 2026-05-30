# 🚀 QUICK START — Claude Code로 오늘 바로 앱 띄우기

> 이 가이드는 처음 앱 개발하시는 분도 **오늘 안에 로컬에서 앱이 동작**하도록 만들어진 단계별 안내서입니다.
> 모든 명령어를 그대로 복붙하시면 됩니다.

---

## ⏱️ 예상 소요 시간

| 단계 | 시간 |
|---|---|
| 1. 사전 준비 (계정·키 발급) | 1~2시간 |
| 2. 개발 환경 설치 | 30분 |
| 3. Claude Code 셋업 | 15분 |
| 4. T-001~T-005 실행 (Claude Code 자동) | 1~2시간 |
| 5. 첫 로그인 + 키워드 등록 화면 보기 | 30분 |
| **합계: 오늘 안에 끝남** | **4~5시간** |

---

## 1단계: 사전 준비 (계정·키 발급)

### 1.1 꼭 필요한 것 (Day 1에 모두 필요)

이것들이 없으면 시작할 수 없습니다. 미리 발급받아 안전한 곳(메모장)에 보관하세요.

#### ✅ GitHub 계정
- https://github.com 가입
- 새 repo 생성: 이름은 `intelligence-news-app`, **Private 권장**, README는 만들지 않음

#### ✅ Anthropic API 키
- https://console.anthropic.com 가입
- Settings → API Keys → Create Key
- **결제 카드 등록 필수** ($5~10 충전 권장)
- 키는 `sk-ant-...` 형식

#### ✅ Supabase 프로젝트
- https://supabase.com 가입 (GitHub 연동 추천)
- New Project → 이름 `intelligence-news`, Region **Northeast Asia (Seoul)** 선택
- 비밀번호는 안전한 곳에 메모
- 프로젝트 생성 후: Settings → API에서 다음 3개 복사
  - `Project URL` (NEXT_PUBLIC_SUPABASE_URL)
  - `anon public` (NEXT_PUBLIC_SUPABASE_ANON_KEY)
  - `service_role` (SUPABASE_SERVICE_ROLE_KEY) ← **비밀, 절대 노출 금지**

### 1.2 2주차에 필요한 것 (지금 미리 받아두면 좋음)

#### ✅ OpenAI API 키 (임베딩용, 매우 저렴)
- https://platform.openai.com 가입
- 결제 카드 등록 후 $5 충전
- API Keys에서 새 키 발급

#### ✅ 네이버 검색 API
- https://developers.naver.com 가입
- Application → 애플리케이션 등록
- 사용 API: **검색** 체크
- Client ID, Client Secret 발급

#### ✅ GNews API (해외 뉴스)
- https://gnews.io 무료 회원가입
- Dashboard에서 API Key 복사

### 1.3 3주차에 필요한 것 (나중에 받아도 됨)

- Resend (이메일 발송): https://resend.com — 도메인 인증 필요
- Vercel (배포): https://vercel.com — GitHub 연동
- Sentry (에러 모니터링): 선택

---

## 2단계: 개발 환경 설치

### 2.1 Node.js 설치

#### macOS
```bash
# Homebrew가 없으면 먼저 설치
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node.js LTS 설치
brew install node@20

# 확인
node --version  # v20.x.x 나오면 OK
```

#### Windows
- https://nodejs.org 에서 **LTS** 버전 다운로드 후 설치
- PowerShell이나 cmd에서 확인:
```powershell
node --version
```

### 2.2 pnpm 설치 (npm보다 빠른 패키지 매니저)

```bash
npm install -g pnpm
pnpm --version  # 9.x 이상 OK
```

### 2.3 Git 설치 (이미 있으면 skip)

#### macOS
```bash
brew install git
```

#### Windows
- https://git-scm.com/download/win 다운로드 후 설치

#### Git 초기 설정 (한 번만)
```bash
git config --global user.name "본인이름"
git config --global user.email "본인이메일@example.com"
```

### 2.4 VS Code 설치 (선택, 코드 편집용)

- https://code.visualstudio.com 다운로드
- Claude Code는 터미널에서 동작하지만, 결과를 보려면 코드 에디터가 있는 게 편함

---

## 3단계: Claude Code 설치

### 3.1 설치

```bash
npm install -g @anthropic-ai/claude-code
```

### 3.2 작업 폴더 만들기

```bash
# Mac/Linux
mkdir -p ~/projects/intelligence-news-app
cd ~/projects/intelligence-news-app

# Windows (PowerShell)
mkdir $HOME\projects\intelligence-news-app
cd $HOME\projects\intelligence-news-app
```

### 3.3 사양서 파일 복사

다운로드받은 ZIP을 이 폴더에 푸세요. 결과적으로:

```
~/projects/intelligence-news-app/
├── 00_README.md
├── 01_PRD.md
├── 02_TECH_SPEC.md
├── 03_DATA_MODEL.sql
├── 04_LLM_PROMPTS.md
├── 05_API_SPEC.md
├── 06_UI_SPEC.md
├── 07_TICKETS.md
├── QUICK_START.md           ← 이 파일
└── PROMPTS_FOR_CLAUDE_CODE.md  ← 다음 파일
```

### 3.4 Claude Code 첫 실행

```bash
claude
```

처음 실행하면 로그인 안내가 나옵니다. 안내대로 따라하시면 됩니다.
- 브라우저가 열리면 Anthropic 계정으로 로그인
- 터미널로 돌아오면 준비 완료

---

## 4단계: Claude Code에게 작업 시키기

이 부분이 핵심입니다. `PROMPTS_FOR_CLAUDE_CODE.md` 파일을 같이 열어두세요.

### 4.1 첫 메시지

Claude Code가 실행된 터미널에서 다음을 그대로 복붙하세요:

```
이 폴더의 사양서를 읽고 Intelligence Daily News App을 만들어줘.

먼저 00_README.md, 01_PRD.md, 02_TECH_SPEC.md를 읽고
전체 그림을 파악해.

그 다음 07_TICKETS.md를 열어서 T-001부터 순서대로 작업하자.
한 번에 모든 티켓을 하지 말고, 티켓 하나씩 완료하면
나에게 확인 받고 다음으로 넘어가줘.

지금 T-001(Next.js + Tailwind + shadcn/ui 스캐폴드)부터 시작해줘.
```

### 4.2 Claude Code가 묻는 것들

진행 중에 Claude Code가 물어볼 만한 것들과 답:

| Claude Code의 질문 | 답 |
|---|---|
| "패키지 설치해도 돼?" | yes |
| "git init 해도 돼?" | yes |
| "이 파일 만들어도 돼?" | yes |
| "이 명령어 실행해도 돼?" | yes (위험한 명령 아니면) |
| "Tailwind 색상 어떻게 할까?" | "02_TECH_SPEC.md와 06_UI_SPEC.md 참고" |

기본적으로 "사양서 따라줘"라고 하면 됩니다.

### 4.3 T-001 완료 후

Claude Code가 "T-001 완료, localhost:3000 에서 확인하세요" 같은 메시지를 보이면:

```bash
# 다른 터미널 창을 열고
cd ~/projects/intelligence-news-app
pnpm dev
```

브라우저에서 http://localhost:3000 열어서 Next.js 기본 페이지가 보이면 성공!

### 4.4 환경변수 입력 (T-002에서 필요)

T-002 진행 중에 Claude Code가 환경변수를 물어볼 거예요. 1.1과 1.2에서 받아둔 키들을 알려주세요:

```
.env.local에 다음 값을 입력해줘:

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
NAVER_CLIENT_ID=xxx
NAVER_CLIENT_SECRET=xxx
GNEWS_API_KEY=xxx
CRON_SECRET=아무거나_긴_랜덤문자열_32자이상
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`CRON_SECRET`은 아래 명령어로 생성:
```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 } | ForEach-Object { [byte]$_ }))
```

### 4.5 데이터베이스 만들기 (T-005)

T-005 단계에서 Supabase 마이그레이션을 실행해야 합니다.

1. Supabase Dashboard 접속 → 본인 프로젝트
2. 왼쪽 메뉴 → **SQL Editor**
3. **New query** 클릭
4. `03_DATA_MODEL.sql` 파일 전체 내용 복붙
5. 우측 하단 **Run** 버튼

성공 메시지가 나오면, Table Editor에서 테이블이 만들어진 걸 확인할 수 있습니다.

---

## 5단계: 첫 화면 보기 (1주차 끝까지)

T-001 ~ T-016 (1주차) 작업이 완료되면:

```bash
pnpm dev
```

브라우저에서 http://localhost:3000 접속 → 다음 플로우 동작:

1. 회원가입 (이메일 + 비밀번호)
2. 온보딩 1단계: 계정 정보
3. 온보딩 2단계: 비즈니스 프로필 입력
4. 온보딩 3단계: 키워드 등록
5. 메인 페이지(피드) — 아직 뉴스 없음

여기까지 오면 **MVP의 절반**이 완성된 거예요.

---

## 6단계: 막혔을 때

### Claude Code가 에러를 만나면

에러 메시지를 그대로 복붙해서 보여주세요:
```
이 에러가 나와:
[에러 메시지 붙여넣기]

어디서 막혔는지 알려주고, 해결책 제안해줘.
```

### 외부 API 키 문제

키가 잘못됐거나 한도 초과면 다음과 같은 에러가 나옵니다:
- `401 Unauthorized` → API 키 잘못 입력
- `429 Too Many Requests` → 한도 초과 (네이버는 일 25,000건, GNews 무료는 일 100건)

### 도움이 필요할 때

언제든 저(Claude)에게 다시 와서 물어봐주세요. 다음을 알려주시면 빠르게 도와드릴 수 있어요:

1. **어느 티켓에서 막혔는지** (예: "T-008 인증 통합에서 막혔어")
2. **무엇을 시도했는지**
3. **에러 메시지 또는 화면 캡처**

---

## 7단계: 일주일 단위 마일스톤

| 시기 | 마일스톤 | 확인 방법 |
|---|---|---|
| **Day 1 끝** | T-001~T-004 완료, Next.js 동작 | localhost:3000 접속 가능 |
| **1주차 끝** | T-001~T-016 완료, 인증+온보딩 | 가입 → 키워드 등록 가능 |
| **2주차 끝** | T-017~T-033 완료, 뉴스 자동 수집 | DB에 뉴스 데이터 쌓임 |
| **3주차 끝** | T-034~T-053 완료, 베타 출시 | 매일 아침 메일 수신 |

---

## 💡 빠른 시작을 위한 팁

### 1. 사양서를 자주 참조시켜라
Claude Code가 임의로 결정하지 못하게 막는 게 핵심:
```
"이 부분 사양서에 어떻게 정의돼 있는지 확인하고 따라줘"
"06_UI_SPEC.md의 카드 컴포넌트 명세대로 만들어줘"
```

### 2. 한 번에 하나씩
Claude Code가 여러 티켓을 묶어 하려고 하면 멈추세요:
```
"T-001만 끝내고 멈춰. 내가 확인하고 다음 진행 지시할게."
```

### 3. 자주 git commit
```bash
# 티켓 끝날 때마다
git add .
git commit -m "T-001 Next.js scaffold 완료"
```

문제 생기면 되돌리기 쉬워집니다.

### 4. 매일 잠깐이라도 사용해보기
앱이 동작하기 시작하면 **본인이 매일 써보는 게** 최고의 베타 테스트입니다.

---

이제 `PROMPTS_FOR_CLAUDE_CODE.md`로 가서 복붙용 프롬프트를 확인하세요! 🚀
