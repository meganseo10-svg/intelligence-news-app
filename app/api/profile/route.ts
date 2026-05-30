import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileSchema = z.object({
  company: z.string().min(1),
  industry: z.string().min(1),
  company_size: z.string().min(1),
  products: z.array(z.string()).min(1),
  target_customers: z.array(z.string()).optional().default([]),
  timezone: z.string().optional(),
  preferred_lang: z.enum(["ko", "en"]).optional(),
  // 시사점 기준 (선택)
  trend_focus: z.string().optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  sales_focus: z.string().optional(),
  threats: z.string().optional(),
});

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 },
    );
  }
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "입력값이 올바르지 않습니다.",
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  // RLS(users_update_own_profile) 덕분에 본인 row만 수정 가능
  const { data, error } = await supabase
    .from("user_profiles")
    .update(parsed.data)
    .eq("user_id", user.id)
    .select()
    .single();
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: error.message } },
      { status: 500 },
    );
  }
  return NextResponse.json(data);
}
