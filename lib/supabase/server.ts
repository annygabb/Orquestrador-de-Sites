import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { serverSupabaseConfig } from "./config";

function hardenedCookieOptions<T extends Record<string, unknown>>(options: T) {
  return { ...options, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
}

export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = serverSupabaseConfig();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) => cookieStore.set(name, value, hardenedCookieOptions(options)));
        } catch {
          // Server Components cannot write cookies; proxy.ts refreshes them.
        }
      },
    },
  });
}
