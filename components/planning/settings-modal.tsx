"use client";

import { SettingsPanel } from "./settings-panel";

/**
 * SettingsPanel (the rhythm ChoiceCards — jours/semaine, minutes/jour) as a
 * popup instead of a permanently-visible block on the Examen page — same
 * fixed-overlay pattern as components/abonnement/pricing-modal.tsx, reused
 * as-is since it's already proven at phone width.
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
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold">Ton rythme de révision</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            ✕
          </button>
        </div>
        <SettingsPanel initialJours={initialJours} initialMinutes={initialMinutes} />
      </div>
    </div>
  );
}
