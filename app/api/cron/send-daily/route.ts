import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { db, notificationSettings } from "@/db";
import { getDigestItems } from "@/lib/feed-query";
import { sendDailyDigest } from "@/lib/notify/email";
import { unauthorized } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 매일 발송 잡 (Vercel Cron, GET). 현재 KST 시각(±15분)에 매칭되는 사용자에게 발송.
 */
async function handle(request: Request) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return unauthorized();
  }

  // 현재 KST 시각/요일/날짜
  const now = new Date();
  const kstMinutes =
    (now.getUTCHours() * 60 + now.getUTCMinutes() + 9 * 60) % 1440;
  const kstWeekday = new Date(now.getTime() + 9 * 3600_000).getUTCDay();
  const today = now.toISOString().slice(0, 10);

  const settings = await db.select().from(notificationSettings);

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: userList } = await admin.auth.admin.listUsers();
  const emailById = new Map(userList.users.map((u) => [u.id, u.email]));

  let sent = 0;
  let skipped = 0;
  for (const s of settings) {
    const [hh, mm] = s.sendTime.split(":").map(Number);
    const target = hh * 60 + mm;
    if (Math.abs(kstMinutes - target) > 15) {
      skipped++;
      continue;
    }
    if (
      s.frequency === "weekly" &&
      !(s.daysOfWeek ?? []).includes(kstWeekday)
    ) {
      skipped++;
      continue;
    }
    const email = emailById.get(s.userId);
    if (!email) continue;

    let items = await getDigestItems(s.userId, today);
    if (s.frequency === "urgent_only") {
      items = items.filter((i) => i.importance >= (s.urgentThreshold ?? 0.8));
    }
    if (items.length === 0) {
      skipped++;
      continue;
    }

    const r = await sendDailyDigest({
      to: email,
      userName: email,
      date: today,
      items,
      userId: s.userId,
    });
    if (r.ok) sent++;
  }

  return NextResponse.json({ ok: true, sent, skipped, total: settings.length });
}

export const GET = handle;
export const POST = handle;
