import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

const SOURCES = ["naver", "gnews", "rss"] as const;

const createSchema = z.object({
  group_id: z.string().uuid(),
  term: z.string().min(1),
  sources: z.array(z.enum(SOURCES)).optional(),
  language: z.enum(["ko", "en", "auto"]).optional(),
});

/** POST /api/keywords — 키워드 추가 (RLS가 그룹 소유 여부 검증) */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return validationError(parsed.error.flatten().fieldErrors);

  const { data, error } = await supabase
    .from("keywords")
    .insert({
      group_id: parsed.data.group_id,
      term: parsed.data.term,
      sources: parsed.data.sources ?? ["naver", "gnews", "rss"],
      language: parsed.data.language ?? "auto",
    })
    .select("id, term, sources, language, is_active")
    .single();
  if (error) return internalError(error.message);
  return NextResponse.json(data);
}
