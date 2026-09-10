"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const LINKS = [
  { href: "/fiches", label: "Fiches" },
  { href: "/examen", label: "Examen" },
  { href: "/planning", label: "Planning" },
  { href: "/quiz", label: "Quiz" },
];

export function NavLinks({ compact = false }: { compact?: boolean }) {
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
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-200",
              active
                ? "bg-accent font-bold text-[#191A2E] shadow-[0_2px_12px_-2px_rgba(232,163,61,0.6)]"
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
