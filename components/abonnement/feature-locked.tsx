"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { SubscriptionTier } from "@/lib/subscription/constants";
import { PricingModal } from "./pricing-modal";

type LockableFeature = "examen" | "quiz" | "planning";

const COPY: Record<LockableFeature, string> = {
  examen: "Un abonnement actif est nécessaire pour créer et consulter des examens.",
  quiz: "Un abonnement actif est nécessaire pour accéder aux quiz.",
  planning: "Un abonnement actif est nécessaire pour accéder au planning.",
};

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
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-10 text-center">
      <span className="text-5xl">🔒</span>
      <div>
        <h1 className="mb-2 font-heading text-2xl font-semibold">Fonctionnalité verrouillée</h1>
        <p className="text-text-muted">{COPY[feature]}</p>
      </div>
      {isAuthenticated ? (
        <>
          <Button size="lg" onClick={() => setPricingOpen(true)}>
            Voir les abonnements
          </Button>
          <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} currentTier={currentTier} />
        </>
      ) : (
        <Link href="/signup" prefetch={true}>
          <Button size="lg">Créer un compte</Button>
        </Link>
      )}
    </div>
  );
}
