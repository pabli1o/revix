import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";

/**
 * Supabase client for use in Server Components, Server Actions and Route
 * Handlers. Reads the session from the request cookies; writes back updated
 * cookies when the session is refreshed (best-effort — Server Components
 * cannot set cookies, only Route Handlers/Server Actions can).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component: the middleware/proxy already
          // refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}
