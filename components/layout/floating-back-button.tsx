"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCanGoBack } from "@/components/navigation/navigation-history-provider";

// Root screens reachable directly from the sidebar nav — the user didn't
// "arrive from elsewhere" to land there, so no back button on these.
const TOP_LEVEL_PATHS = new Set(["/fiches", "/examen", "/planning", "/quiz", "/corbeille", "/abonnement"]);

/**
 * Small floating "✕" button, present on every screen reached by navigating
 * deeper into the app (a matière, a chapitre, a fiche, the quiz for a
 * chapitre, the creation flow…). Prefers router.back() — which respects
 * wherever the user actually came from (e.g. back to /planning for a fiche
 * opened from a planning task, instead of always landing on the chapter's
 * fiche list) — and only falls back to the parent route when there's no
 * real in-app history yet (a fresh tab, a bookmark, a full reload).
 */
export function FloatingBackButton() {
  const pathname = usePathname();
  const router = useRouter();
  const canGoBack = useCanGoBack();

  if (TOP_LEVEL_PATHS.has(pathname)) return null;

  function handleClick() {
    if (canGoBack) {
      router.back();
      return;
    }
    const segments = pathname.split("/").filter(Boolean);
    segments.pop();
    router.push(segments.length ? `/${segments.join("/")}` : "/fiches");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Retour"
      className="fixed left-4 top-16 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-bg-card text-lg leading-none text-text shadow-lg transition-transform hover:border-accent active:scale-90 md:left-[272px] md:top-6"
    >
      ✕
    </button>
  );
}
