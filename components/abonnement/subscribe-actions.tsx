"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/i18n/locale-provider";

export function BuyCreditButton({
  className,
  size,
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/whop/credit-checkout", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
      window.alert(data.error ?? t.abonnement.buyCreditError);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} className={className} size={size}>
      {loading ? t.abonnement.redirecting : t.abonnement.addCreditsButton}
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
  const { t } = useLocale();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (!window.confirm(t.abonnement.cancelConfirm)) {
      return;
    }
    setLoading(true);
    const res = await fetch("/api/whop/cancel-subscription", { method: "POST" });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (data.ok) {
      window.location.reload();
    } else {
      setLoading(false);
      window.alert(data.error ?? t.abonnement.cancelError);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} variant="secondary">
      {loading ? t.abonnement.cancelling : t.abonnement.cancelButton}
    </Button>
  );
}
