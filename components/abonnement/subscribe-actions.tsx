"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/whop/checkout", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      window.alert(data.error ?? "Impossible de démarrer le paiement.");
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} size="lg">
      {loading ? "Redirection…" : "S'abonner — 9,99 €/mois"}
    </Button>
  );
}

export function BuyCreditButton({
  className,
  size,
  label = "Débloquer 1500 crédits — 9,99 €",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Override the default label — e.g. the /limite screen must show only
   * the price to pay, never the unlocked amount. */
  label?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/whop/credit-checkout", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      window.alert(data.error ?? "Impossible de démarrer le paiement.");
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className={className} size={size}>
      {loading ? "Redirection…" : label}
    </Button>
  );
}

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
