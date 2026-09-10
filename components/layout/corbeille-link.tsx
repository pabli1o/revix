"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

/** Icon-only link to the corbeille — kept out of the main 4-tab bar
 * (Fiches/Examen/Planning/Quiz) per the design spec, but still reachable
 * from every screen via the header icons. */
export function CorbeilleLink() {
  const pathname = usePathname();
  const active = pathname === "/corbeille" || pathname.startsWith("/corbeille/");

  return (
    <Link
      href="/corbeille"
      aria-label="Corbeille"
      title="Corbeille"
      className={clsx(
        "flex size-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors",
        active ? "bg-accent text-[#191A2E]" : "text-text-muted hover:bg-bg-card hover:text-text",
      )}
    >
      🗑️
    </Link>
  );
}
