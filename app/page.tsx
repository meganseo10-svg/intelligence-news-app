import Link from "next/link";
import { redirect } from "next/navigation";
import { Newspaper, Sparkles, Mail, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Newspaper,
    title: "내 키워드 자동 수집",
    desc: "네이버·해외 매체·RSS에서 매일 관련 뉴스를 모아요.",
  },
  {
    icon: Sparkles,
    title: "우리 회사 관점 시사점",
    desc: "AI가 번역·요약하고 '내 비즈니스에 어떤 의미인지'까지 정리해요.",
  },
  {
    icon: Mail,
    title: "매일 아침 이메일",
    desc: "원하는 시각에 브리핑이 메일로 도착해요.",
  },
  {
    icon: Share2,
    title: "한 번에 공유",
    desc: "분석한 뉴스를 링크·메일로 동료에게 바로 공유해요.",
  },
];

export default async function Home() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/feed");

  return (
    <main className="mx-auto max-w-3xl px-4">
      <section className="flex flex-col items-center py-20 text-center">
        <div className="mb-4 flex items-center gap-2 text-muted-foreground">
          <Newspaper className="h-5 w-5" />
          <span className="text-sm font-medium">Intelligence Daily</span>
        </div>
        <h1 className="text-balance text-3xl font-semibold leading-tight sm:text-4xl">
          매일 아침, 내 비즈니스 관점의 뉴스 브리핑
        </h1>
        <p className="mt-4 max-w-xl text-balance text-muted-foreground">
          관심 키워드의 국내외 뉴스를 AI가 번역·요약하고, 우리 회사 관점의
          시사점까지 정리해 매일 전달해요.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link href="/signup">시작하기</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">로그인</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 pb-20 sm:grid-cols-2">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="rounded-xl border bg-background p-5">
              <Icon className="mb-2 h-5 w-5" />
              <h3 className="text-base font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          );
        })}
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        <Link href="/terms" className="hover:underline">
          이용약관
        </Link>
        {" · "}
        <Link href="/privacy" className="hover:underline">
          개인정보처리방침
        </Link>
      </footer>
    </main>
  );
}
