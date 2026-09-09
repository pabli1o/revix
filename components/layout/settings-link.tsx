"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

/** Icon-only link to the settings/subscription page, kept visually apart
 * from the main Fiches/Planning/Quiz/Corbeille nav group. */
export function SettingsLink() {
  const pathname = usePathname();
  const active = pathname === "/abonnement" || pathname.startsWith("/abonnement/");

  return (
    <Link
      href="/abonnement"
      aria-label="Paramètres"
      title="Paramètres"
      className={clsx(
        "flex size-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors",
        active
          ? "bg-accent text-[#191A2E]"
          : "text-text-muted hover:bg-bg-card hover:text-text",
      )}
    >
      ⚙️
    </Link>
  );
}
