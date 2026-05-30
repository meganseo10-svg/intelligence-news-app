import Link from "next/link";

export const metadata = { title: "이용약관 · Intel Daily" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="text-sm text-muted-foreground hover:underline">
        ← 홈으로
      </Link>
      <h1 className="mb-6 mt-4 text-2xl font-semibold">이용약관</h1>
      <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
        <p>
          본 약관은 Intelligence Daily(이하 “서비스”)의 이용 조건을 규정합니다.
          (베타 버전 — 정식 출시 전 법무 검토 예정)
        </p>
        <section>
          <h2 className="mb-1 font-medium text-foreground">1. 서비스 내용</h2>
          <p>
            서비스는 사용자가 등록한 키워드 기반으로 공개된 뉴스를
            수집·요약·번역하고 비즈니스 관점의 분석을 제공합니다.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-medium text-foreground">
            2. 뉴스 저작권 고지
          </h2>
          <p>
            서비스가 제공하는 뉴스의 원문 저작권은 각 언론사 및 저작권자에게
            있습니다. 서비스는 제목·요약·링크 등 인용 범위 내에서 정보를
            제공하며, 전체 본문 열람은 원문 링크를 통해 이루어집니다. 사용자는
            공유 기능 이용 시 저작권을 준수해야 합니다.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-medium text-foreground">3. 책임의 한계</h2>
          <p>
            AI가 생성한 요약·시사점은 참고용이며 정확성을 보장하지 않습니다.
            중요한 의사결정 시 원문을 확인하시기 바랍니다.
          </p>
        </section>
        <section>
          <h2 className="mb-1 font-medium text-foreground">4. 계정</h2>
          <p>
            사용자는 본인 계정의 보안을 유지할 책임이 있으며, 서비스는 약관 위반
            시 이용을 제한할 수 있습니다.
          </p>
        </section>
        <p className="text-xs">최종 업데이트: 2026-05-30 (베타)</p>
      </div>
    </main>
  );
}
