import { createClient } from "@/lib/supabase/server";
import {
  KeywordManager,
  type Group,
} from "@/components/settings/KeywordManager";
import { BackButton } from "@/components/BackButton";

export default async function SettingsKeywordsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("keyword_groups")
    .select(
      "id, category, name, sort_order, keywords(id, term, sources, language, is_active)",
    )
    .eq("user_id", user!.id)
    .order("sort_order");

  const groups = (data ?? []) as Group[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <BackButton fallback="/settings" />
      <h1 className="text-xl font-medium">키워드 관리</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">
        매일 수집할 키워드를 그룹별로 관리하세요. 소스(네이버/GNews/RSS)와 활성
        여부도 조절할 수 있어요.
      </p>
      <KeywordManager initialGroups={groups} />
    </main>
  );
}
