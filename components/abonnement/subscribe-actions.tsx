"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Whop has no hosted self-service billing portal to redirect to like
 * Stripe's — this calls the cancellation API directly instead, so it needs
 * its own confirmation step first (a portal redirect implicitly gave the
 * user a chance to back out; a direct API call doesn't unless we add one).
 */
export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (
      !window.confirm(
        "Résilier ton abonnement ? Tu garderas l'accès jusqu'à la fin de la période en cours, puis il ne sera pas renouvelé.",
      )
    ) {
      return;
    }
    setLoading(true);
    const res = await fetch("/api/whop/cancel-subscription", { method: "POST" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (data.ok) {
      window.location.reload();
    } else {
      setLoading(false);
      window.alert(data.error ?? "Impossible de résilier l'abonnement.");
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} variant="secondary">
      {loading ? "Résiliation…" : "Résilier mon abonnement"}
    </Button>
  );
}
