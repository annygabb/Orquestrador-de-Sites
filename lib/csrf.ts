import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = process.env.NODE_ENV === "production" ? "__Host-os_csrf" : "os_csrf";

export function newCsrfToken() {
  return randomBytes(32).toString("base64url");
}

export async function setCsrfCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 30 * 60,
  });
}

export async function hasValidCsrf(request: Request) {
  const supplied = request.headers.get("x-csrf-token") ?? "";
  const expected = (await cookies()).get(COOKIE)?.value ?? "";
  if (!supplied || !expected) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
