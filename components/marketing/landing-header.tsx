"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMenu } from "@/components/ui/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";

/**
 * Collant en haut de la landing page : logo à gauche, "Connexion" + un menu
 * à droite (jamais une barre de nav complète toujours visible — tient sur
 * un téléphone sans rien tasser). Le menu ouvre un panneau avec les mêmes
 * ancres que la page, plus le CTA d'essai en bas pour mobile.
 */
export function LandingHeader() {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "#comment-ca-marche", label: t.landing.header.navComment },
    { href: "#fonctionnalites", label: t.landing.header.navFonctionnalites },
    { href: "#faq", label: t.landing.header.navFaq },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-heading text-xl font-bold tracking-tight text-accent">
            Reviix
          </Link>
          <LanguageSwitcher />
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:border-accent hover:text-accent"
          >
            {t.landing.header.connexion}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t.landing.header.closeMenu : t.landing.header.openMenu}
            aria-expanded={open}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-text transition-colors hover:border-accent hover:text-accent"
          >
            {open ? <span aria-hidden className="text-lg leading-none">✕</span> : <IconMenu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-bg px-4 py-4 sm:px-6">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-elevated"
              >
                {link.label}
              </a>
            ))}
            <ButtonLink href="/onboarding" size="lg" className="mt-2 w-full" onClick={() => setOpen(false)}>
              {t.landing.header.essayerGratuitement}
            </ButtonLink>
          </nav>
        </div>
      )}
    </header>
  );
}
