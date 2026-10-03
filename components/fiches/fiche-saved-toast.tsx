"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SuccessToast } from "@/components/ui/success-toast";

/**
 * Shows the "fiches enregistrées" toast on /fiches right after a save
 * (see assign-flow.tsx, which redirects here with ?saved=1 instead of
 * showing its own inline confirmation screen). The param is stripped
 * immediately on mount — via router.replace, before the toast's own
 * display timer even starts — so a refresh or back-navigation to /fiches
 * never re-triggers it; the toast then stays visible purely from this
 * component's own state, independent of the URL.
 */
export function FicheSavedToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Lazy initializer: reads the param once, at the component's first
  // render, rather than via a setState call inside an effect body.
  const [visible, setVisible] = useState(() => searchParams.get("saved") === "1");

  useEffect(() => {
    // Side effect only (no React state write here) — strips the param so
    // a refresh or back-navigation to /fiches never re-triggers the toast;
    // it then stays visible purely from this component's own state.
    if (visible) {
      router.replace(pathname, { scroll: false });
    }
    // Deliberately once-on-mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;
  return (
    <SuccessToast message="Tes fiches ont bien été enregistrées" onDismiss={() => setVisible(false)} />
  );
}
