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

/**
 * NEXT_PUBLIC_SITE_URL, when set, always wins — but if it's ever missing or
 * misconfigured (e.g. accidentally pointed at one immutable Vercel
 * deployment URL, which stops resolving as soon as that deployment is
 * superseded — the exact "This deployment is unavailable" failure this
 * guards against), fall back to VERCEL_PROJECT_PRODUCTION_URL. Unlike
 * VERCEL_URL (per-deployment, changes every deploy), Vercel sets this to
 * the project's actual stable production domain (custom domain included)
 * automatically, with zero configuration — so Stripe's success/cancel
 * redirect always lands somewhere real.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
