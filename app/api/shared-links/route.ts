import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { createClient } from "@/lib/supabase/server";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

const schema = z.object({
  scope: z.enum(["single_news", "daily_digest"]).default("single_news"),
  resource_id: z.string().uuid(),
  include_insights: z.boolean().default(true),
  user_note: z.string().optional(),
  expires_in: z.enum(["24h", "7d", "30d", "never"]).default("7d"),
});

function expiresAt(v: string): string | null {
  if (v === "never") return null;
  const ms = { "24h": 1, "7d": 7, "30d": 30 }[v]! * 86_400_000;
  return new Date(Date.now() + ms).toISOString();
}

/** POST /api/shared-links — 공개 공유 링크 생성 (스냅샷 저장) */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return validationError(parsed.error.flatten().fieldErrors);

  // 공유 시점의 뉴스/번역/시사점 스냅샷 구성
  const { data: news } = await supabase
    .from("news_items")
    .select("id, url, publisher, original_lang, title_original")
    .eq("id", parsed.data.resource_id)
    .single();
  if (!news)
    return validationError({ resource_id: ["뉴스를 찾을 수 없어요."] });

  const { data: translation } = await supabase
    .from("translations")
    .select("title_translated, summary_translated")
    .eq("news_id", news.id)
    .eq("target_lang", "ko")
    .maybeSingle();

  let insight = null;
  if (parsed.data.include_insights) {
    const { data } = await supabase
      .from("insights")
      .select("category, sales_opportunity, target_customer, risk_signal")
      .eq("news_id", news.id)
      .eq("user_id", user.id)
      .maybeSingle();
    insight = data;
  }

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ?? "익명";

  const token = nanoid(10);
  const exp = expiresAt(parsed.data.expires_in);

  const { error } = await supabase.from("shared_links").insert({
    user_id: user.id,
    token,
    scope: parsed.data.scope,
    resource_id: news.id,
    resource_data: {
      news,
      translation,
      insight,
      user_note: parsed.data.user_note ?? null,
      shared_by_name: displayName,
    },
    include_insights: parsed.data.include_insights,
    user_note: parsed.data.user_note ?? null,
    expires_at: exp,
  });
  if (error) return internalError(error.message);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    token,
    url: `${appUrl}/s/${token}`,
    expires_at: exp,
  });
}
