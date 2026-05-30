"use server";

import { createClient } from "@/lib/supabase/server";

const CATEGORY_NAMES: Record<string, string> = {
  competitor: "경쟁사",
  industry: "업계 동향",
  product: "제품·기술",
  general: "일반",
};

export interface OnboardingGroupInput {
  category: string;
  terms: string[];
}

/**
 * 온보딩 마지막 단계: 키워드 그룹 + 키워드를 생성하고 온보딩을 완료 처리한다.
 * RLS 덕분에 본인 데이터만 생성된다. 성공 시 { ok: true }.
 */
export async function finishOnboarding(groups: OnboardingGroupInput[]) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "로그인이 필요합니다." };

  try {
    let sortOrder = 0;
    for (const g of groups) {
      const terms = g.terms.map((t) => t.trim()).filter(Boolean);
      if (terms.length === 0) continue;

      const { data: grp, error: gErr } = await supabase
        .from("keyword_groups")
        .insert({
          user_id: user.id,
          category: g.category,
          name: CATEGORY_NAMES[g.category] ?? g.category,
          sort_order: sortOrder++,
        })
        .select("id")
        .single();
      if (gErr || !grp) {
        return { ok: false as const, error: gErr?.message ?? "그룹 생성 실패" };
      }

      const { error: kErr } = await supabase
        .from("keywords")
        .insert(terms.map((term) => ({ group_id: grp.id, term })));
      if (kErr) return { ok: false as const, error: kErr.message };
    }

    const { error: pErr } = await supabase
      .from("user_profiles")
      .update({ onboarding_completed: true })
      .eq("user_id", user.id);
    if (pErr) return { ok: false as const, error: pErr.message };

    return { ok: true as const };
  } catch (e) {
    return {
      ok: false as const,
      error: e instanceof Error ? e.message : "알 수 없는 오류",
    };
  }
}
