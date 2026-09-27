"use client";

import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { TIERS, TIER_ORDER, type SubscriptionTier } from "@/lib/subscription/constants";

const BADGE_BY_TIER: Partial<Record<SubscriptionTier, string>> = {
  tier2: "Populaire",
  tier3: "Meilleure valeur",
};

/**
 * The 3 subscription offers, shown identically everywhere a user is asked
 * to pick one: the /abonnement page, the fiche-unlock popup, and the
 * quiz/planning "fonctionnalité verrouillée" screens. Handles the checkout
 * POST + redirect itself so every call site gets the same behavior for
 * free; `draftId` threads through for the fiche-creation flow, where a
 * subscription is started before the draft has been saved.
 */
export function PricingCards({
  currentTier,
  draftId,
  onCheckoutError,
}: {
  /** Marks one card as the user's current plan (disabled, "Abonnement
   * actuel") instead of offering to subscribe to it again — used on
   * /abonnement and the feature-locked screens, never for a first-time
   * subscriber who has no tier yet. */
  currentTier?: SubscriptionTier | null;
  draftId?: string;
  onCheckoutError?: (message: string) => void;
}) {
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);

  async function handleSelect(tier: SubscriptionTier) {
    setLoadingTier(tier);
    const res = await fetch("/api/whop/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tier, ...(draftId ? { draftId } : {}) }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.assign(data.url);
    } else {
      setLoadingTier(null);
      onCheckoutError?.(data.error ?? "Impossible de démarrer le paiement.");
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {TIER_ORDER.map((tierId) => {
        const tier = TIERS[tierId];
        const isCurrent = currentTier === tierId;
        // Tier 1 is deliberately the plain option — the visual emphasis on
        // 2 and 3 is what's supposed to make them read as the better deal.
        const highlighted = tierId !== "tier1";
        const badge = BADGE_BY_TIER[tierId];

        return (
          <div
            key={tierId}
            className={clsx(
              "relative flex flex-col gap-4 rounded-2xl border p-5 pt-6",
              highlighted
                ? "border-accent bg-accent/5 shadow-[0_4px_24px_-8px_rgba(232,163,61,0.5)]"
                : "border-border bg-bg-card",
            )}
          >
            {badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold whitespace-nowrap uppercase tracking-wide text-[#191A2E]">
                {badge}
              </span>
            )}

            <div>
              <p className="font-heading text-lg font-semibold">{tier.label}</p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-semibold text-accent">
                  {tier.priceEur.toFixed(2).replace(".", ",")} €
                </span>
                <span className="text-sm text-text-muted">/mois</span>
              </p>
              <p className="mt-1 font-mono text-sm text-text-muted">{tier.credits} crédits / mois</p>
            </div>

            <ul className="flex flex-col gap-1.5 text-sm">
              <li className="flex items-center gap-2">
                <span aria-hidden>✅</span>
                <span>Génération de fiches</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>{tier.features.quiz ? "✅" : "❌"}</span>
                <span>{tier.features.quiz ? "Accès au quiz" : "Pas de quiz"}</span>
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden>{tier.features.planning ? "✅" : "❌"}</span>
                <span>{tier.features.planning ? "Accès au planning" : "Pas de planning"}</span>
              </li>
            </ul>

            <Button
              className="mt-auto w-full"
              variant={highlighted ? "primary" : "secondary"}
              disabled={isCurrent || loadingTier !== null}
              onClick={() => handleSelect(tierId)}
            >
              {isCurrent ? "Abonnement actuel" : loadingTier === tierId ? "Redirection…" : "S'abonner"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
