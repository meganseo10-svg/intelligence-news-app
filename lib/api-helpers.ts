import { NextResponse } from "next/server";

/** 05_API_SPEC.md의 공통 에러 형식 */
export function errJson(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  return NextResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export const unauthorized = () =>
  errJson("UNAUTHORIZED", "로그인이 필요합니다.", 401);

export const validationError = (details?: unknown) =>
  errJson("VALIDATION_ERROR", "입력값이 올바르지 않습니다.", 400, details);

export const internalError = (message: string) =>
  errJson("INTERNAL_ERROR", message, 500);
