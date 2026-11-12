"use client";

import { useState } from "react";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { IconCheck, IconMinus } from "@/components/ui/icons";
import { TIERS, TIER_ORDER, type SubscriptionTier } from "@/lib/subscription/constants";
import { useLocale } from "@/components/i18n/locale-provider";

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
  const { t } = useLocale();
  const [loadingTier, setLoadingTier] = useState<SubscriptionTier | null>(null);

  const badgeByTier: Partial<Record<SubscriptionTier, string>> = {
    tier1: t.abonnement.badgePopular,
    tier2: t.abonnement.badgeBestValue,
  };

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
      onCheckoutError?.(data.error ?? t.abonnement.checkoutError);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {TIER_ORDER.map((tierId) => {
        const tier = TIERS[tierId];
        const isCurrent = currentTier === tierId;
        // tier0 (the fiches-only entry plan) is deliberately the plain
        // option — the visual emphasis on the others is what's supposed to
        // make them read as the better deal.
        const highlighted = tierId !== "tier0";
        const badge = badgeByTier[tierId];

        return (
          <div
            key={tierId}
            className={clsx(
              "relative flex flex-col gap-4 rounded-2xl border p-5 pt-6",
              highlighted
                ? "border-accent bg-accent/5 shadow-[0_4px_24px_-8px_rgba(30,58,95,0.4)]"
                : "border-border bg-bg-card",
            )}
          >
            {badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold whitespace-nowrap uppercase tracking-wide text-white">
                {badge}
              </span>
            )}

            <div>
              <p className="font-heading text-lg font-semibold">{t.abonnement.tierLabels[tierId] ?? tier.label}</p>
              <p className="mt-1 flex items-baseline gap-1">
                <span className="font-heading text-3xl font-semibold text-accent">
                  {tier.priceEur.toFixed(2).replace(".", ",")} €
                </span>
                <span className="text-sm text-text-muted">{t.abonnement.perMonth}</span>
              </p>
              <p className="mt-1 font-mono text-sm text-text-muted">
                {tier.credits} {t.abonnement.creditsPerMonth}
              </p>
              <p className="mt-0.5 text-xs text-text-muted">
                {t.abonnement.estimatedFiches(tier.estimatedFiches.min, tier.estimatedFiches.max)}
              </p>
            </div>

            <ul className="flex flex-col gap-1.5 text-sm">
              <li className="flex items-center gap-2">
                <IconCheck className="size-4 shrink-0 text-accent" />
                <span>{t.abonnement.featureFiches}</span>
              </li>
              <li className="flex items-center gap-2">
                {tier.features.quiz ? (
                  <IconCheck className="size-4 shrink-0 text-accent" />
                ) : (
                  <IconMinus className="size-4 shrink-0 text-text-muted" />
                )}
                <span>{tier.features.quiz ? t.abonnement.featureQuizOn : t.abonnement.featureQuizOff}</span>
              </li>
              <li className="flex items-center gap-2">
                {tier.features.planning ? (
                  <IconCheck className="size-4 shrink-0 text-accent" />
                ) : (
                  <IconMinus className="size-4 shrink-0 text-text-muted" />
                )}
                <span>{tier.features.planning ? t.abonnement.featurePlanningOn : t.abonnement.featurePlanningOff}</span>
              </li>
              <li className="flex items-center gap-2">
                {tier.features.examen ? (
                  <IconCheck className="size-4 shrink-0 text-accent" />
                ) : (
                  <IconMinus className="size-4 shrink-0 text-text-muted" />
                )}
                <span>{tier.features.examen ? t.abonnement.featureExamenOn : t.abonnement.featureExamenOff}</span>
              </li>
            </ul>

            <Button
              className="mt-auto w-full"
              variant={highlighted ? "primary" : "secondary"}
              disabled={isCurrent || loadingTier !== null}
              onClick={() => handleSelect(tierId)}
            >
              {isCurrent ? t.abonnement.currentPlanButton : loadingTier === tierId ? t.abonnement.redirecting : t.abonnement.subscribeButton}
            </Button>
          </div>
        );
      })}

      <p className="col-span-full text-xs text-text-muted">{t.abonnement.estimateDisclaimer}</p>
    </div>
  );
}
