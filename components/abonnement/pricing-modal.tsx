"use client";

import { useState } from "react";
import type { SubscriptionTier } from "@/lib/subscription/constants";
import { PricingCards } from "./pricing-cards";

/**
 * The 3-offer picker as a popup — used wherever a user hits a paywall
 * mid-flow (an unlocked fiche, a locked quiz/planning screen) rather than
 * being sent to a whole new page. /abonnement renders <PricingCards>
 * inline instead, since it's already a dedicated subscription page.
 */
export function PricingModal({
  open,
  onClose,
  currentTier,
  draftId,
}: {
  open: boolean;
  onClose: () => void;
  currentTier?: SubscriptionTier | null;
  draftId?: string;
}) {
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-heading text-xl font-semibold">Choisis ton abonnement</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-text-muted transition-colors hover:border-accent hover:text-accent"
          >
            ✕
          </button>
        </div>
        {error && (
          <p className="mb-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">
            {error}
          </p>
        )}
        <PricingCards currentTier={currentTier} draftId={draftId} onCheckoutError={setError} />
      </div>
    </div>
  );
}
