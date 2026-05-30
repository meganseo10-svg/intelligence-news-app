import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 미들웨어가 1차로 막지만, 레이아웃에서도 한 번 더 방어
  if (!user) {
    redirect("/login");
  }

  const displayName = user.user_metadata?.display_name as string | undefined;

  return (
    <div className="min-h-dvh">
      <Header email={user.email} displayName={displayName} />
      {children}
    </div>
  );
}
