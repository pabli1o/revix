"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type LockableTab = "examen" | "planning" | "quiz";

const LINKS: { href: string; label: string; key: LockableTab | "fiches" }[] = [
  { href: "/fiches", label: "Fiches", key: "fiches" },
  { href: "/examen", label: "Examen", key: "examen" },
  { href: "/planning", label: "Planning", key: "planning" },
  { href: "/quiz", label: "Quiz", key: "quiz" },
];

export function NavLinks({
  compact = false,
  locked = {},
}: {
  compact?: boolean;
  /** Which of the 3 non-Fiches tabs show a lock icon — purely cosmetic, a
   * hint before the click: the actual gate is enforced on each
   * destination page (see app/(app)/examen|planning|quiz/page.tsx), so
   * this never blocks navigation itself. */
  locked?: Partial<Record<LockableTab, boolean>>;
}) {
  const pathname = usePathname();

  return (
    <nav
      className={clsx(
        "bg-bg",
        compact
          ? "flex items-center gap-1 overflow-x-auto rounded-full p-1.5"
          : "flex flex-col gap-1 rounded-2xl p-2",
      )}
    >
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        const isLocked = link.key !== "fiches" && locked[link.key];
        return (
          <Link
            key={link.href}
            href={link.href}
            // Full route prefetched (data included, not just the shared
            // layout shell) for every tab, since this nav is always
            // mounted and in viewport from the moment the user lands
            // anywhere in the app — by the time a tab is clicked for the
            // first time, its RSC payload is already sitting in the
            // client router cache (staleTimes.static, see
            // next.config.ts), so even a first visit hits cache instead
            // of a cold server round trip. Default prefetch on a dynamic
            // route (every app/(app)/** segment, via cookies()) only
            // prefetches down to a loading.tsx boundary — this project
            // has none, so without this it was prefetching almost
            // nothing.
            prefetch={true}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200",
              active
                ? "bg-accent font-bold text-white shadow-[0_2px_12px_-2px_rgba(30,58,95,0.35)]"
                : "text-text-muted hover:bg-bg-card hover:text-text",
            )}
          >
            {isLocked && <span aria-hidden>🔒 </span>}
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
