import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

const updateSchema = z.object({ name: z.string().min(1) });

/** PUT /api/keyword-groups/[id] — 그룹 이름 변경 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success)
    return validationError(parsed.error.flatten().fieldErrors);

  const { data, error } = await supabase
    .from("keyword_groups")
    .update({ name: parsed.data.name })
    .eq("id", params.id)
    .eq("user_id", user.id)
    .select("id, category, name, sort_order")
    .single();
  if (error) return internalError(error.message);
  return NextResponse.json(data);
}

/** DELETE /api/keyword-groups/[id] — 그룹 삭제 (키워드도 cascade) */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { error } = await supabase
    .from("keyword_groups")
    .delete()
    .eq("id", params.id)
    .eq("user_id", user.id);
  if (error) return internalError(error.message);
  return NextResponse.json({ ok: true });
}
