import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  internalError,
  unauthorized,
  validationError,
} from "@/lib/api-helpers";

const DEFAULTS = {
  frequency: "daily",
  send_time: "08:30:00",
  days_of_week: [1, 2, 3, 4, 5],
  urgent_threshold: 0.8,
  auto_translate: true,
  show_original_first: false,
  group_clusters: true,
};

/** GET /api/notification-settings — 현재 설정(없으면 기본값) */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json(data ?? DEFAULTS);
}

const putSchema = z.object({
  frequency: z.enum(["daily", "weekly", "urgent_only"]),
  send_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
  urgent_threshold: z.number().min(0).max(1).optional(),
  auto_translate: z.boolean().optional(),
  show_original_first: z.boolean().optional(),
  group_clusters: z.boolean().optional(),
});

/** PUT /api/notification-settings — 설정 저장(upsert) */
export async function PUT(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success)
    return validationError(parsed.error.flatten().fieldErrors);

  const sendTime =
    parsed.data.send_time.length === 5
      ? `${parsed.data.send_time}:00`
      : parsed.data.send_time;

  const { data, error } = await supabase
    .from("notification_settings")
    .upsert(
      {
        user_id: user.id,
        frequency: parsed.data.frequency,
        send_time: sendTime,
        days_of_week: parsed.data.days_of_week ?? [1, 2, 3, 4, 5],
        urgent_threshold: parsed.data.urgent_threshold ?? 0.8,
        auto_translate: parsed.data.auto_translate ?? true,
        show_original_first: parsed.data.show_original_first ?? false,
        group_clusters: parsed.data.group_clusters ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .select()
    .single();
  if (error) return internalError(error.message);
  return NextResponse.json(data);
}
