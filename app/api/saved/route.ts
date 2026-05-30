import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

const saveSchema = z.object({
  news_id: z.string().uuid(),
  user_note: z.string().optional(),
});

/** POST /api/saved — 뉴스 북마크 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(body);
  if (!parsed.success)
    return validationError(parsed.error.flatten().fieldErrors);

  const { error } = await supabase.from("saved_news").insert({
    user_id: user.id,
    news_id: parsed.data.news_id,
    user_note: parsed.data.user_note ?? null,
  });
  // 이미 저장돼 있으면(unique 충돌) 무시
  if (error && !error.message.includes("duplicate")) {
    return internalError(error.message);
  }
  return NextResponse.json({ ok: true });
}
