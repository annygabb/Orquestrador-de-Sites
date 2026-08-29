import { baseURL } from "@/baseUrl";

export function hasTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(baseURL).origin;
  } catch {
    return false;
  }
}
