import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 이미 온보딩을 마친 사용자는 피드로
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed")
    .eq("user_id", user.id)
    .single();
  if (profile?.onboarding_completed) redirect("/feed");

  return (
    <div className="flex min-h-dvh justify-center bg-muted/30 px-4 py-10">
      <div className="w-full max-w-lg">{children}</div>
    </div>
  );
}
