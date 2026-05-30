import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processUserFeed, runCollectForAllUsers } from "@/lib/pipeline";
import { getDigestItems } from "@/lib/feed-query";
import { sendDailyDigest } from "@/lib/notify/email";
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

  if (action === "send") {
    // 본인 오늘 다이제스트를 즉시 메일로 발송 (테스트용). to 미지정 시 본인 이메일.
    const today = new Date().toISOString().slice(0, 10);
    const items = await getDigestItems(user.id, today);
    if (items.length === 0) {
      return NextResponse.json({
        ok: true,
        sent: false,
        reason: "오늘 피드 뉴스가 없어요.",
      });
    }
    const to = typeof body?.to === "string" && body.to ? body.to : user.email!;
    const userName =
      (user.user_metadata?.display_name as string | undefined) ?? user.email!;
    const result = await sendDailyDigest({
      to,
      userName,
      date: today,
      items,
      userId: user.id,
    });
    return NextResponse.json({ ...result, sent: result.ok, to });
  }

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
