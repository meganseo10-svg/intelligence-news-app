"use client";

import Link from "next/link";
import { Bell, Bookmark, Newspaper, Search, Settings } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  email?: string;
  displayName?: string;
  isAdmin?: boolean;
}

export function Header({ email, displayName, isAdmin }: HeaderProps) {
  const initial = (displayName || email || "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/feed" className="flex items-center gap-2 font-medium">
          <Newspaper className="h-5 w-5" />
          <span>Intel Daily</span>
        </Link>

        <nav className="flex items-center gap-1 text-muted-foreground">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="피드/검색"
          >
            <Link href="/feed">
              <Search className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="저장한 뉴스"
          >
            <Link href="/saved">
              <Bookmark className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="알림 설정"
          >
            <Link href="/settings/notifications">
              <Bell className="h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="설정"
          >
            <Link href="/settings">
              <Settings className="h-5 w-5" />
            </Link>
          </Button>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="ml-1 rounded-full outline-none"
                aria-label="계정 메뉴"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs">{initial}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="font-normal">
                <div className="text-sm font-medium">
                  {displayName || "사용자"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {email}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings/profile">프로필</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/saved">저장한 뉴스</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">설정</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">관리자 대시보드</Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <form action={signOut}>
                <DropdownMenuItem asChild>
                  <button
                    type="submit"
                    className="w-full cursor-pointer text-left"
                  >
                    로그아웃
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
