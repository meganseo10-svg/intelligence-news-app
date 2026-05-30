import { createClient } from "@/lib/supabase/server";
import {
  ProfileEditor,
  type ProfileEditorValue,
} from "@/components/settings/ProfileEditor";
import { BackButton } from "@/components/BackButton";

export default async function SettingsProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  const initial: ProfileEditorValue = {
    displayName:
      (user!.user_metadata?.display_name as string | undefined) ?? "",
    company: profile?.company ?? "",
    industry: profile?.industry ?? "",
    company_size: profile?.company_size ?? "",
    products: profile?.products ?? [],
    target_customers: profile?.target_customers ?? [],
    trend_focus: profile?.trend_focus ?? "",
    strengths: profile?.strengths ?? "",
    weaknesses: profile?.weaknesses ?? "",
    sales_focus: profile?.sales_focus ?? "",
    threats: profile?.threats ?? "",
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <BackButton fallback="/settings" />
      <h1 className="mb-1 text-xl font-medium">프로필</h1>
      <p className="mb-6 text-sm text-muted-foreground">{user!.email}</p>
      <ProfileEditor initial={initial} />
    </main>
  );
}
