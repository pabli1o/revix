"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SettingsPanel } from "./settings-panel";
import { useLocale } from "@/components/i18n/locale-provider";

/**
 * SettingsPanel (the rhythm ChoiceCards — jours/semaine, minutes/jour) as a
 * popup instead of a permanently-visible block on the Examen page — same
 * fixed-overlay pattern as components/abonnement/pricing-modal.tsx, reused
 * as-is since it's already proven at phone width.
 *
 * Nothing is persisted while picking — only "Valider" (a sticky full-width
 * button, kept outside the scrollable area so it never scrolls out of
 * view) saves and regenerates the planning, then closes. Closing any other
 * way (the ✕, or tapping the backdrop) discards the pending selection: this
 * component is always mounted by its callers (examen-view.tsx,
 * settings-menu.tsx both keep it in the tree and toggle `open`), so a plain
 * mount-time useState wouldn't reset between a cancelled attempt and the
 * next time it opens — the effect below re-syncs to the last saved values
 * every time `open` turns true instead.
 */
export function SettingsModal({
  open,
  onClose,
  initialJours,
  initialMinutes,
}: {
  open: boolean;
  onClose: () => void;
  initialJours: number;
  initialMinutes: number;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [jours, setJours] = useState(initialJours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [saving, setSaving] = useState(false);

  // Re-syncs to the last saved values every time the modal transitions
  // closed -> open, discarding any unsaved pick from a previous cancelled
  // attempt — adjusting state during render (React's documented pattern
  // for "reset when a prop changes"), not in an effect, since this
  // component is always mounted by its callers and never actually
  // unmounts between opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setJours(initialJours);
      setMinutes(initialMinutes);
    }
  }

  if (!open) return null;

  async function handleValidate() {
    setSaving(true);
    await fetch("/api/planning/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionJoursSemaine: jours, revisionMinutesJour: minutes }),
    });
    await fetch("/api/planning/generate", { method: "POST" });
    setSaving(false);
    router.refresh();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl border border-border bg-bg-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between gap-4 p-6 pb-5">
          <h2 className="font-heading text-xl font-semibold">{t.nav.settingsModal.title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          <SettingsPanel
            jours={jours}
            minutes={minutes}
            onChangeJours={setJours}
            onChangeMinutes={setMinutes}
          />
        </div>

        <div className="shrink-0 p-6 pt-5">
          <Button size="lg" className="w-full" onClick={handleValidate} disabled={saving}>
            {saving ? t.common.saving : t.nav.settingsModal.validate}
          </Button>
        </div>
      </div>
    </div>
  );
}
