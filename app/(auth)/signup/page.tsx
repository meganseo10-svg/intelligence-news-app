"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!agreed) {
      setError("이용약관 및 개인정보처리방침에 동의해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.session) {
      // 이메일 확인이 꺼져 있으면 바로 세션 생성 → 온보딩으로
      router.push("/onboarding/profile");
      router.refresh();
    } else {
      // 이메일 확인이 켜져 있으면 확인 메일 안내
      setMessage(
        "확인 메일을 보냈어요. 메일의 링크를 눌러 인증을 완료한 뒤 로그인하세요.",
      );
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">회원가입</CardTitle>
        <CardDescription>
          매일 아침, 내 비즈니스 관점의 뉴스 브리핑을 받아보세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <p className="text-sm text-foreground">{message}</p>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">표시 이름</Label>
              <Input
                id="displayName"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="홍길동"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상"
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>
                <Link href="/terms" className="underline">
                  이용약관
                </Link>{" "}
                및{" "}
                <Link href="/privacy" className="underline">
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </span>
            </label>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "가입 중…" : "회원가입"}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            로그인
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
