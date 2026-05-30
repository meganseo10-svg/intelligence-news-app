import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { suggestKeywords } from "@/lib/llm/suggest-keywords";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

/** POST /api/keywords/suggest — 로그인 사용자 프로필 기반 AI 키워드 추천 */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("company, industry, products")
    .eq("user_id", user.id)
    .single();

  if (!profile?.company) {
    return validationError({ company: ["회사 프로필을 먼저 입력하세요."] });
  }

  const suggestions = await suggestKeywords(
    {
      company: profile.company,
      industry: profile.industry ?? "",
      products: profile.products ?? [],
    },
    user.id,
  );
  if (!suggestions) return internalError("AI 키워드 추천에 실패했어요.");

  return NextResponse.json({ suggestions });
}
