"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useLocale } from "./locale-provider";
import { LOCALES } from "@/lib/i18n/locale";
import { IconChevronDown, IconCheck } from "@/components/ui/icons";

/**
 * FR/EN/ES button + dropdown, meant to sit next to the logo everywhere
 * (landing header, auth/onboarding cards, the app shell's top bar — see
 * each call site). Each language is written in itself (Français/English/
 * Español), never translated, so the active-language label is never a
 * mystery to someone who can't yet read the current UI language.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className={clsx("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.languageSwitcher.label}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-11 items-center gap-1 rounded-full border border-border px-3 text-sm font-semibold text-text transition-colors hover:border-accent hover:text-accent"
      >
        {locale.toUpperCase()}
        <IconChevronDown className={clsx("size-4 transition-transform duration-150", open && "rotate-180")} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t.languageSwitcher.label}
          className="absolute top-full left-0 z-50 mt-2 w-44 overflow-hidden rounded-2xl border border-border bg-bg-card py-1.5 shadow-xl"
        >
          {LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={locale === option}
              onClick={() => {
                setLocale(option);
                setOpen(false);
              }}
              className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm font-medium text-text transition-colors hover:bg-bg-elevated"
            >
              {t.languageSwitcher.names[option]}
              {locale === option && <IconCheck className="size-4 shrink-0 text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
