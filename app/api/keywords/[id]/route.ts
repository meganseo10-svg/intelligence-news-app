import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

const SOURCES = ["naver", "gnews", "rss"] as const;

const updateSchema = z
  .object({
    term: z.string().min(1).optional(),
    sources: z.array(z.enum(SOURCES)).optional(),
    language: z.enum(["ko", "en", "auto"]).optional(),
    is_active: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "변경할 값이 없습니다.",
  });

/** PUT /api/keywords/[id] — 소스/활성/이름 수정 (RLS가 소유 검증) */
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
    .from("keywords")
    .update(parsed.data)
    .eq("id", params.id)
    .select("id, term, sources, language, is_active")
    .single();
  if (error) return internalError(error.message);
  return NextResponse.json(data);
}

/** DELETE /api/keywords/[id] */
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
    .from("keywords")
    .delete()
    .eq("id", params.id);
  if (error) return internalError(error.message);
  return NextResponse.json({ ok: true });
}
