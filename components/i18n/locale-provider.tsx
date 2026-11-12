"use client";

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { dictionaries, type Dictionary } from "@/lib/i18n/dictionaries";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/locale";

interface LocaleContextValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Wraps the whole app (see app/layout.tsx) with the locale resolved
 * server-side from the cookie (lib/i18n/server.ts's getLocale(), itself
 * fed by lib/supabase/middleware.ts's first-visit negotiation) as the
 * initial value — every client component reads/changes the language
 * through useLocale() rather than its own state.
 *
 * Switching language never does a hard navigation: setLocale updates this
 * context immediately (every "use client" string swaps on the spot), sets
 * the cookie, and calls router.refresh() only to re-render Server
 * Components (page.tsx files reading getDictionary() directly) against
 * the new cookie — a soft RSC re-fetch, not a page reload.
 */
export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      setLocaleState(next);
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, t: dictionaries[locale], setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within a LocaleProvider");
  return ctx;
}
