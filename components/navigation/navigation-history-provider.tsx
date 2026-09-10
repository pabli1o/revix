"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const NavigationHistoryContext = createContext(false);

/**
 * Tracks whether the user has navigated at least once within the app since
 * this tab loaded (any client-side pathname change). The floating back
 * button (components/layout/floating-back-button.tsx) uses this to decide
 * whether router.back() is safe to call: when it is, it lands on wherever
 * the user actually came from (e.g. the planning screen, for a fiche opened
 * from a planning task) instead of a generic fallback route.
 */
export function NavigationHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    if (previousPathnameRef.current !== null && previousPathnameRef.current !== pathname) {
      setCanGoBack(true);
    }
    previousPathnameRef.current = pathname;
  }, [pathname]);

  return (
    <NavigationHistoryContext.Provider value={canGoBack}>{children}</NavigationHistoryContext.Provider>
  );
}

export function useCanGoBack(): boolean {
  return useContext(NavigationHistoryContext);
}
