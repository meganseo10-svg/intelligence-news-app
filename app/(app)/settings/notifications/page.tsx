import { createClient } from "@/lib/supabase/server";
import {
  NotificationSettings,
  type NotificationSettingsValue,
} from "@/components/settings/NotificationSettings";

export default async function SettingsNotificationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("notification_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  const initial: NotificationSettingsValue = {
    frequency: data?.frequency ?? "daily",
    send_time: data?.send_time ?? "08:30:00",
    days_of_week: data?.days_of_week ?? [1, 2, 3, 4, 5],
    auto_translate: data?.auto_translate ?? true,
    show_original_first: data?.show_original_first ?? false,
    group_clusters: data?.group_clusters ?? true,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-xl font-medium">알림 설정</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        매일 아침 받을 뉴스 브리핑의 주기·시각·표시 옵션을 설정하세요.
      </p>
      <NotificationSettings initial={initial} />
    </main>
  );
}
