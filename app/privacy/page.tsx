import Link from "next/link";

export const metadata = { title: "개인정보처리방침 · Intel Daily" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← 홈으로
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-semibold">개인정보처리방침</h1>
      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>(베타 버전 — 정식 출시 전 법무 검토 예정)</p>
        <section>
          <h2 className="mb-1 font-medium text-foreground">1. 수집하는 정보</h2>
          <p>
            이메일, 표시 이름, 회사 프로필(회사명·업종·제품·타겟 고객), 등록
            키워드, 알림 설정. 서비스 제공을 위해 필요한 최소한의 정보만
            수집합니다.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-medium text-foreground">2. 이용 목적</h2>
          <p>
            뉴스 큐레이션·분석 제공, 이메일/채널 알림 발송, 서비스 개선.
            프로필과 키워드는 “우리 회사 관점” 분석 생성에만 사용됩니다.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-medium text-foreground">3. 제3자 처리</h2>
          <p>
            서비스 운영을 위해 Supabase(데이터 저장), OpenAI/Anthropic(분석),
            Resend(이메일 발송) 등 처리위탁을 이용합니다. 각 제공자의 보안
            정책을 따릅니다.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-medium text-foreground">4. 보관 및 파기</h2>
          <p>
            계정 삭제 요청 시 관련 개인정보는 지체 없이 파기됩니다. 데이터는
            사용자 본인만 접근 가능하도록 행 수준 보안(RLS)으로 격리됩니다.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-medium text-foreground">5. 문의</h2>
          <p>개인정보 관련 문의: megan.seo@cyberdigm.co.kr</p>
        </section>
        <p className="text-xs">최종 업데이트: 2026-05-30 (베타)</p>
      </div>
    </main>
  );
}
