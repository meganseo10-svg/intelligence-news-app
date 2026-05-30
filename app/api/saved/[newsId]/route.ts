import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

/** DELETE /api/saved/[newsId] — 북마크 해제 */
export async function DELETE(
  _request: Request,
  { params }: { params: { newsId: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { error } = await supabase
    .from("saved_news")
    .delete()
    .eq("user_id", user.id)
    .eq("news_id", params.newsId);
  if (error) return internalError(error.message);
  return NextResponse.json({ ok: true });
}

const noteSchema = z.object({ user_note: z.string() });

/** PUT /api/saved/[newsId] — 메모 수정 */
export async function PUT(
  request: Request,
  { params }: { params: { newsId: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = noteSchema.safeParse(body);
  if (!parsed.success)
    return validationError(parsed.error.flatten().fieldErrors);

  const { error } = await supabase
    .from("saved_news")
    .update({ user_note: parsed.data.user_note })
    .eq("user_id", user.id)
    .eq("news_id", params.newsId);
  if (error) return internalError(error.message);
  return NextResponse.json({ ok: true });
}
