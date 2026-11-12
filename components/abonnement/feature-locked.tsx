"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconLock } from "@/components/ui/icons";
import type { SubscriptionTier } from "@/lib/subscription/constants";
import { PricingModal } from "./pricing-modal";
import { useLocale } from "@/components/i18n/locale-provider";

type LockableFeature = "examen" | "quiz" | "planning";

/**
 * Shown instead of the real examen/quiz/planning content for anyone
 * without the access it requires — an anonymous visitor, an account with
 * no active subscription, or a subscriber whose tier doesn't include that
 * feature (tier0, "Fiches" — see lib/subscription/constants.ts).
 *
 * The CTA differs by `isAuthenticated`: opening the pricing popup calls
 * /api/whop/checkout, which requires a session — pointless (and
 * confusing) for an anonymous visitor, who gets a plain link to /signup
 * instead.
 */
export function FeatureLocked({
  feature,
  currentTier,
  isAuthenticated = true,
}: {
  feature: LockableFeature;
  currentTier: SubscriptionTier | null;
  isAuthenticated?: boolean;
}) {
  const { t } = useLocale();
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-10 text-center">
      <IconLock className="size-12 text-accent" />
      <div>
        <h1 className="mb-2 font-heading text-2xl font-semibold">{t.abonnement.lockedTitle}</h1>
        <p className="text-text-muted">{t.abonnement.lockedCopy[feature]}</p>
      </div>
      {isAuthenticated ? (
        <>
          <Button size="lg" onClick={() => setPricingOpen(true)}>
            {t.abonnement.viewPlans}
          </Button>
          <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} currentTier={currentTier} />
        </>
      ) : (
        <Link href="/signup" prefetch={true}>
          <Button size="lg">{t.abonnement.createAccount}</Button>
        </Link>
      )}
    </div>
  );
}
