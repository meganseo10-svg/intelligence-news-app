"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { ProgressBar } from "./ProgressBar";
import { TagInput } from "./TagInput";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const INDUSTRIES = [
  "B2B SaaS",
  "제조",
  "금융",
  "커머스·리테일",
  "의료·헬스케어",
  "교육",
  "미디어·콘텐츠",
  "건설·부동산",
  "기타",
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

const profileSchema = z.object({
  displayName: z.string().min(1, "이름을 입력하세요"),
  company: z.string().min(1, "회사명을 입력하세요"),
  industry: z.string().min(1, "업종을 선택하세요"),
  company_size: z.enum(COMPANY_SIZES, {
    errorMap: () => ({ message: "회사 규모를 선택하세요" }),
  }),
  products: z
    .array(z.string())
    .min(1, "주력 제품·서비스를 최소 1개 추가하세요"),
  target_customers: z.array(z.string()),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  email: string;
  initialDisplayName: string;
  initial: {
    company: string;
    industry: string;
    company_size: string;
    products: string[];
    target_customers: string[];
  };
}

export function ProfileForm({
  email,
  initialDisplayName,
  initial,
}: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: initialDisplayName,
      company: initial.company,
      industry: initial.industry,
      company_size: (initial.company_size ||
        undefined) as ProfileFormValues["company_size"],
      products: initial.products,
      target_customers: initial.target_customers,
    },
  });

  async function onSubmit(values: ProfileFormValues) {
    setError(null);
    const supabase = createClient();
    // 표시 이름은 auth 메타데이터에 저장
    await supabase.auth.updateUser({
      data: { display_name: values.displayName },
    });
    // 비즈니스 프로필은 API로 저장 (타임존 자동 감지)
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: values.company,
        industry: values.industry,
        company_size: values.company_size,
        products: values.products,
        target_customers: values.target_customers,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        preferred_lang: "ko",
      }),
    });
    if (!res.ok) {
      setError("저장에 실패했어요. 잠시 후 다시 시도해주세요.");
      return;
    }
    router.push("/onboarding/keywords");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <ProgressBar current={1} total={2} />
        <div>
          <CardTitle className="text-xl">회사 프로필</CardTitle>
          <CardDescription>
            입력하신 정보로 뉴스 시사점을 “우리 회사 관점”으로 분석해요.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">표시 이름</Label>
            <Input id="displayName" {...register("displayName")} />
            {errors.displayName && (
              <p className="text-sm text-destructive">
                {errors.displayName.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">{email}</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company">회사명</Label>
            <Input
              id="company"
              {...register("company")}
              placeholder="예: 사이버다임"
            />
            {errors.company && (
              <p className="text-sm text-destructive">
                {errors.company.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>업종</Label>
              <Controller
                control={control}
                name="industry"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((i) => (
                        <SelectItem key={i} value={i}>
                          {i}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.industry && (
                <p className="text-sm text-destructive">
                  {errors.industry.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>회사 규모</Label>
              <Controller
                control={control}
                name="company_size"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}명
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.company_size && (
                <p className="text-sm text-destructive">
                  {errors.company_size.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>주력 제품·서비스</Label>
            <Controller
              control={control}
              name="products"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="입력 후 Enter (예: 문서중앙화)"
                />
              )}
            />
            {errors.products && (
              <p className="text-sm text-destructive">
                {errors.products.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>
              타겟 고객 <span className="text-muted-foreground">(선택)</span>
            </Label>
            <Controller
              control={control}
              name="target_customers"
              render={({ field }) => (
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="입력 후 Enter (예: 금융권)"
                />
              )}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "저장 중…" : "다음: 키워드 등록"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
