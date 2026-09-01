import { baseURL } from "@/baseUrl";

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return process.env.NODE_ENV !== "production";
  try {
    const allowed = new Set([
      new URL(baseURL).origin,
      process.env.APP_ORIGIN ? new URL(process.env.APP_ORIGIN).origin : "",
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
    ].filter(Boolean));
    return allowed.has(new URL(origin).origin);
  } catch {
    return false;
  }
}
