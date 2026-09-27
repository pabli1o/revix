"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SubscriptionTier } from "@/lib/subscription/constants";
import { PricingModal } from "./pricing-modal";

const COPY: Record<"quiz" | "planning", string> = {
  quiz: "Ton abonnement actuel ne donne pas accès aux quiz.",
  planning: "Ton abonnement actuel ne donne pas accès au planning.",
};

/** Shown instead of the real quiz/planning content for a subscriber whose
 * tier doesn't include that feature (tier1, "Fiches" — see
 * lib/subscription/constants.ts). Never reached by a non-subscriber: those
 * routes/pages are gated by isActive first, which redirects to /login or
 * shows the fiche paywall instead. */
export function FeatureLocked({
  feature,
  currentTier,
}: {
  feature: "quiz" | "planning";
  currentTier: SubscriptionTier | null;
}) {
  const [pricingOpen, setPricingOpen] = useState(false);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-6 pt-10 text-center">
      <span className="text-5xl">🔒</span>
      <div>
        <h1 className="mb-2 font-heading text-2xl font-semibold">Fonctionnalité verrouillée</h1>
        <p className="text-text-muted">{COPY[feature]}</p>
      </div>
      <Button size="lg" onClick={() => setPricingOpen(true)}>
        Voir les abonnements
      </Button>
      <PricingModal open={pricingOpen} onClose={() => setPricingOpen(false)} currentTier={currentTier} />
    </div>
  );
}
