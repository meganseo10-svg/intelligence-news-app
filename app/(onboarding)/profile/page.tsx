import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/onboarding/ProfileForm";

export default async function OnboardingProfilePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company, industry, company_size, products, target_customers")
    .eq("user_id", user!.id)
    .single();

  return (
    <ProfileForm
      email={user!.email ?? ""}
      initialDisplayName={
        (user!.user_metadata?.display_name as string | undefined) ?? ""
      }
      initial={{
        company: profile?.company ?? "",
        industry: profile?.industry ?? "",
        company_size: profile?.company_size ?? "",
        products: profile?.products ?? [],
        target_customers: profile?.target_customers ?? [],
      }}
    />
  );
}
