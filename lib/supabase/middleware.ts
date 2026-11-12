import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { getSupabasePublishableKey, getSupabaseUrl } from "./env";
import { LOCALE_COOKIE, isLocale, negotiateLocale } from "@/lib/i18n/locale";

const PUBLIC_PREFIX_PATHS = ["/login", "/signup", "/auth/callback", "/forgot-password", "/reset-password"];

// Exact matches only (never a prefix) — the app shell (Fiches/Examen/
// Planning/Quiz) is reachable without an account (onboarding happens
// before signup, generation is capped at one free fiche — see
// creation-flow.tsx and app/api/fiches/generate/route.ts), but a deeper
// route under these (a real saved matière/chapitre/fiche, a quiz
// attempt) must stay protected: nothing real exists there for an
// anonymous or non-subscribed visitor anyway, and a prefix match would
// also expose another account's actual data pages.
const PUBLIC_EXACT_PATHS = ["/onboarding", "/fiches", "/fiches/new", "/examen", "/planning", "/quiz"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_EXACT_PATHS.includes(pathname) ||
    PUBLIC_PREFIX_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  );
}

/**
 * Refreshes the Supabase auth session on every request and redirects signed
 * out users away from protected routes. Called from `proxy.ts`.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // First visit only: no cookie yet, so negotiate once from the browser's
  // Accept-Language (fr/en/es, else French — see negotiateLocale) and set
  // it on both the request (so this same request's server components —
  // lib/i18n/server.ts's getLocale() — see it immediately, same pattern
  // as the Supabase session cookies above) and the response (so it
  // persists). Every later request already carries the cookie and a
  // visitor's own choice (components/i18n/locale-provider.tsx) always
  // overwrites it, so this never runs again for that visitor.
  if (!isLocale(request.cookies.get(LOCALE_COOKIE)?.value)) {
    const locale = negotiateLocale(request.headers.get("accept-language"));
    request.cookies.set(LOCALE_COOKIE, locale);
    // Set directly on the existing response (never reassign it here) —
    // the Supabase client above may have already swapped `response` for
    // one carrying refreshed session cookies (its setAll callback); a
    // fresh NextResponse.next() would silently drop those.
    response.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  const { pathname } = request.nextUrl;

  // API routes handle their own 401 JSON responses — redirecting them to
  // /login would hand a fetch() caller an HTML page instead of JSON.
  if (!user && pathname !== "/" && !pathname.startsWith("/api/") && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/signup";
    return NextResponse.redirect(url);
  }

  return response;
}
