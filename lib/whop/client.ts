import "server-only";

import { WhopClient } from "@whop/sdk";

let client: WhopClient | null = null;

/** Lazily-constructed Whop client — server-only (API key). Bearer-token
 * auth, unlike Stripe's secret-key-in-constructor style. */
export function getWhop(): WhopClient {
  if (!client) {
    const token = process.env.WHOP_API_KEY;
    if (!token) throw new Error("Missing WHOP_API_KEY");
    client = new WhopClient({ token });
  }
  return client;
}

/**
 * NEXT_PUBLIC_SITE_URL, when set, always wins — but if it's ever missing or
 * misconfigured (e.g. accidentally pointed at one immutable Vercel
 * deployment URL, which stops resolving as soon as that deployment is
 * superseded — the exact "This deployment is unavailable" failure this
 * guards against), fall back to VERCEL_PROJECT_PRODUCTION_URL. Unlike
 * VERCEL_URL (per-deployment, changes every deploy), Vercel sets this to
 * the project's actual stable production domain (custom domain included)
 * automatically, with zero configuration — so the post-checkout redirect
 * always lands somewhere real.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
