import "server-only";
import { cookies } from "next/headers";
import { dictionaries, type Dictionary } from "./dictionaries";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, type Locale } from "./locale";

/**
 * Reads the locale cookie set by lib/supabase/middleware.ts (which also
 * negotiates it from Accept-Language on a visitor's very first request —
 * see negotiateLocale in ./locale.ts) — by the time any server component
 * or route handler runs, the cookie is always already set. Falls back to
 * DEFAULT_LOCALE only for a request that somehow bypassed the middleware
 * (e.g. a route outside proxy.ts's matcher).
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getDictionary(): Promise<Dictionary> {
  const locale = await getLocale();
  return dictionaries[locale];
}
