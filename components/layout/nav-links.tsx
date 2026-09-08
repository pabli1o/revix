"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/fiches", label: "Fiches" },
  { href: "/planning", label: "Planning" },
  { href: "/abonnement", label: "Abonnement" },
  { href: "/corbeille", label: "Corbeille" },
];

export function NavLinks({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname();

  return (
    <nav
      className={clsx(
        compact ? "flex items-center gap-3 overflow-x-auto" : "flex flex-col gap-1",
      )}
    >
      {LINKS.map((link) => {
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-accent text-[#191A2E]"
                : "text-text-muted hover:bg-bg-card hover:text-text",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
