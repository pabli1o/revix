"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function SubscribeButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
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
  label = "Débloquer 499 crédits — 9,99 €",
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
    const res = await fetch("/api/stripe/credit-checkout", { method: "POST" });
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

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      window.alert(data.error ?? "Impossible d'ouvrir la gestion de l'abonnement.");
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} variant="secondary">
      {loading ? "Redirection…" : "Gérer mon abonnement"}
    </Button>
  );
}
