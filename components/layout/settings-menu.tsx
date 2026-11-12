"use client";

import { useState } from "react";
import Link from "next/link";
import { IconSettings } from "@/components/ui/icons";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { SettingsModal } from "@/components/planning/settings-modal";
import { useLocale } from "@/components/i18n/locale-provider";

/**
 * Single entry point for everything that used to be two separate icon
 * buttons (CorbeilleLink + SettingsLink) in the top bar: Corbeille,
 * account/subscription settings (already one page, /abonnement — see its
 * "Profil" and "Abonnement" sections), rhythm-of-revision settings (the
 * same SettingsModal used from the Examen tab), and sign out. Pure
 * navigation/composition of existing destinations — no new logic.
 */
export function SettingsMenu({
  revisionJoursSemaine,
  revisionMinutesJour,
}: {
  revisionJoursSemaine: number;
  revisionMinutesJour: number;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [rhythmOpen, setRhythmOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t.nav.settingsMenu.ariaLabel}
        title={t.nav.settingsMenu.ariaLabel}
        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-card hover:text-text"
      >
        <IconSettings className="size-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-end bg-black/70 p-4 pt-16 md:items-center md:justify-center md:pt-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-border bg-bg-card p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <Link
              href="/abonnement"
              prefetch={true}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-bg-elevated"
            >
              {t.nav.settingsMenu.accountAndSubscription}
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setRhythmOpen(true);
              }}
              className="block w-full rounded-xl px-4 py-3 text-left text-sm font-medium text-text transition-colors hover:bg-bg-elevated"
            >
              {t.nav.settingsMenu.rhythm}
            </button>
            <Link
              href="/corbeille"
              prefetch={true}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm font-medium text-text transition-colors hover:bg-bg-elevated"
            >
              {t.nav.settingsMenu.corbeille}
            </Link>
            <div className="mt-1 border-t border-border pt-1">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}

      <SettingsModal
        open={rhythmOpen}
        onClose={() => setRhythmOpen(false)}
        initialJours={revisionJoursSemaine}
        initialMinutes={revisionMinutesJour}
      />
    </>
  );
}
