import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

// 임시 피드 화면 — 로그인/세션/로그아웃 플로우 확인용.
// 실제 데일리 피드는 T-034에서 구현하며 이 파일을 교체한다.
export default async function FeedPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-medium">오늘의 인텔리전스</h1>
      <p className="mt-2 text-muted-foreground">
        로그인됨: <span className="text-foreground">{user?.email}</span>
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        피드 화면은 T-034에서 만들 예정이에요. 지금은 로그인·세션·로그아웃
        확인용 임시 화면입니다.
      </p>
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="outline">
          로그아웃
        </Button>
      </form>
    </main>
  );
}
