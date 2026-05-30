import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processUserFeed, runCollectForAllUsers } from "@/lib/pipeline";
import { errJson, unauthorized, validationError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 수동 트리거 (관리자 전용). Cron을 기다리지 않고 즉시 수집 실행.
 * body: { action: "collect", scope?: "me" | "all" }
 */
export async function POST(request: Request) {
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
    return errJson("FORBIDDEN", "관리자만 사용할 수 있어요.", 403);
  }

  const body = await request.json().catch(() => ({}));
  const action = body?.action ?? "collect";
  const scope = body?.scope ?? "me";

  if (action !== "collect") {
    return validationError({ action: ["지원하지 않는 action 입니다."] });
  }

  if (scope === "all") {
    const result = await runCollectForAllUsers({ maxItemsPerUser: 8 });
    return NextResponse.json({ ok: true, scope, ...result });
  }

  const stats = await processUserFeed(user.id, { maxItems: 8 });
  return NextResponse.json({ ok: true, scope: "me", stats });
}
