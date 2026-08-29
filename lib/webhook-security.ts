import { timingSafeEqual } from "node:crypto";

export function validWebhookToken(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const a = Buffer.from(received); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
