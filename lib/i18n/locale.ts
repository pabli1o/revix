/** No "server-only" here — read by both server code (middleware, route
 * handlers, server components) and client code (the locale provider). */

export type Locale = "fr" | "en" | "es";

export const LOCALES: Locale[] = ["fr", "en", "es"];

export const DEFAULT_LOCALE: Locale = "fr";

/** Plain cookie, no URL prefix — every page keeps its existing address. */
export const LOCALE_COOKIE = "reviix_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (LOCALES as string[]).includes(value);
}

/** BCP47 tag used for Intl.NumberFormat/DateTimeFormat — the app only
 * bills in EUR and has one set of pages, so this only changes how numbers,
 * dates, and separators read, never currency or routing. */
export const INTL_TAG: Record<Locale, string> = {
  fr: "fr-FR",
  en: "en-US",
  es: "es-ES",
};

/** First-visit fallback: the first of the browser's Accept-Language
 * preferences that we support, else DEFAULT_LOCALE. Shared by middleware
 * (sets the cookie) and anywhere else that needs the same negotiation. */
export function negotiateLocale(acceptLanguageHeader: string | null): Locale {
  if (!acceptLanguageHeader) return DEFAULT_LOCALE;
  const preferred = acceptLanguageHeader
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase().slice(0, 2))
    .filter(Boolean);
  for (const lang of preferred) {
    if (isLocale(lang)) return lang;
  }
  return DEFAULT_LOCALE;
}
