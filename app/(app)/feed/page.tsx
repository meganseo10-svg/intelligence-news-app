import { createClient } from "@/lib/supabase/server";

// 임시 피드 화면 — 로그인/세션/헤더 확인용.
// 실제 데일리 피드는 T-034에서 구현하며 이 파일을 교체한다.
export default async function FeedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-medium">오늘의 인텔리전스</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        로그인됨: <span className="text-foreground">{user?.email}</span>
      </p>
      <div className="mt-6 rounded-xl border bg-background p-6 text-sm text-muted-foreground">
        피드 화면은 T-034에서 만들 예정이에요. 지금은 헤더·로그인·세션 확인용
        임시 화면입니다. 우측 상단 아바타를 눌러 메뉴와 로그아웃을, 옆의 해/달
        아이콘으로 다크모드를 확인해보세요.
      </div>
    </main>
  );
}
