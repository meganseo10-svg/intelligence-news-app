import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

/** GET /api/keyword-groups — 본인의 그룹 + 키워드 전체 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data, error } = await supabase
    .from("keyword_groups")
    .select(
      "id, category, name, sort_order, keywords(id, term, sources, language, is_active)",
    )
    .eq("user_id", user.id)
    .order("sort_order");
  if (error) return internalError(error.message);
  return NextResponse.json({ groups: data });
}

const createGroupSchema = z.object({
  category: z.enum(["competitor", "industry", "product", "general"]),
  name: z.string().min(1),
});

/** POST /api/keyword-groups — 새 그룹 생성 */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createGroupSchema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.flatten().fieldErrors);
  }

  const { data, error } = await supabase
    .from("keyword_groups")
    .insert({
      user_id: user.id,
      category: parsed.data.category,
      name: parsed.data.name,
    })
    .select("id, category, name, sort_order")
    .single();
  if (error) return internalError(error.message);
  return NextResponse.json({ ...data, keywords: [] });
}
