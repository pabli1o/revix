import "server-only";

import { WhopClient } from "@whop/sdk";

const SANDBOX_BASE_URL = "https://sandbox-api.whop.com/api/v1";

/**
 * WHOP_SANDBOX=true switches every credential (API key, plan, webhook
 * secret, account) to its "_SANDBOX" counterpart and points the client at
 * Whop's sandbox base URL, so testing with fake cards never touches the
 * production credentials or a real charge. Flip it back to false (or
 * unset it) to return to production with no other code change — the
 * non-sandbox variable names are exactly the ones already documented in
 * .env.example.
 */
export function isWhopSandbox(): boolean {
  return process.env.WHOP_SANDBOX === "true";
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

/** The sandbox/production split applies to every credential the same way:
 * read `${name}_SANDBOX` when WHOP_SANDBOX=true, else `name` unchanged. */
export function whopEnv(name: string): string | undefined {
  return process.env[isWhopSandbox() ? `${name}_SANDBOX` : name];
}

let client: WhopClient | null = null;
let clientIsSandbox: boolean | null = null;

/** Lazily-constructed Whop client — server-only (API key). Bearer-token
 * auth, unlike Stripe's secret-key-in-constructor style. Rebuilt if
 * WHOP_SANDBOX changes since the last call (cheap to check, and avoids a
 * long-lived dev server serving a stale sandbox-or-not client after the
 * env var is edited without a restart). */
export function getWhop(): WhopClient {
  const sandbox = isWhopSandbox();
  if (!client || clientIsSandbox !== sandbox) {
    const token = requiredEnv(sandbox ? "WHOP_API_KEY_SANDBOX" : "WHOP_API_KEY");
    client = new WhopClient({ token, ...(sandbox ? { baseUrl: SANDBOX_BASE_URL } : {}) });
    clientIsSandbox = sandbox;
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
