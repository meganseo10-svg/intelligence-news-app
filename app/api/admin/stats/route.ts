import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAdminStats } from "@/lib/admin-stats";
import { errJson, unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!user.email || !admins.includes(user.email)) {
    return errJson("FORBIDDEN", "관리자만 볼 수 있어요.", 403);
  }

  const stats = await getAdminStats();
  return NextResponse.json(stats);
}
