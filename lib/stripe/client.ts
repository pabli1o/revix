import "server-only";

import Stripe from "stripe";

let stripe: Stripe | null = null;

/** Lazily-constructed Stripe client — server-only (secret key). */
export function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    stripe = new Stripe(key);
  }
  return stripe;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
