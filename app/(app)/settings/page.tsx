import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-xl font-medium">설정</h1>
      <div className="divide-y overflow-hidden rounded-xl border">
        <Link
          href="/settings/keywords"
          className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
        >
          <div>
            <div className="text-sm font-medium">키워드</div>
            <div className="text-xs text-muted-foreground">
              수집 키워드 그룹·소스 관리
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>

        {/* 아래 항목은 이후 티켓에서 구현 (T-041 등) */}
        <div className="flex items-center justify-between px-4 py-3 opacity-50">
          <div>
            <div className="text-sm font-medium">프로필</div>
            <div className="text-xs text-muted-foreground">회사 정보 수정</div>
          </div>
          <span className="text-xs text-muted-foreground">준비중</span>
        </div>
        <Link
          href="/settings/notifications"
          className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
        >
          <div>
            <div className="text-sm font-medium">알림</div>
            <div className="text-xs text-muted-foreground">
              발송 주기·시각·표시 옵션
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </main>
  );
}
