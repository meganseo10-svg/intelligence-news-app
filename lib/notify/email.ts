import { Resend } from "resend";
import { render } from "@react-email/render";
import { DailyDigest, type DigestItem } from "@/emails/DailyDigest";
import { logApiUsage } from "@/lib/usage";

/** 데일리 다이제스트 이메일 발송 (Resend) */
export async function sendDailyDigest(params: {
  to: string;
  userName: string;
  date: string;
  items: DigestItem[];
  userId?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey)
    return { ok: false, error: "RESEND_API_KEY가 설정되지 않았습니다." };

  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resend = new Resend(apiKey);

  const html = await render(
    DailyDigest({
      userName: params.userName,
      date: params.date,
      items: params.items,
      appUrl,
    }),
  );

  const { data, error } = await resend.emails.send({
    from,
    to: params.to,
    subject: `📰 ${params.date} 인텔리전스 브리핑 (${params.items.length}건)`,
    html,
  });

  await logApiUsage({
    source: "resend_email",
    userId: params.userId ?? null,
    status: error ? "error" : "ok",
    errorMessage: error?.message,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, id: data?.id };
}
