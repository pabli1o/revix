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
 * Prefers deriving the site's own origin from the incoming request's Host
 * header when one is given: whatever domain the browser used to call this
 * route is guaranteed to be the domain it's already logged in on (it's the
 * same tab, a same-origin fetch), so redirecting back there after Whop
 * Checkout can never land the user on a domain where their Supabase auth
 * cookies don't apply. This matters specifically because NEXT_PUBLIC_SITE_URL
 * is easy to leave configured for production only — a Vercel Preview
 * deployment (a different domain entirely) would otherwise send the
 * post-payment redirect to production instead, where the user has no
 * session, and land them on /login instead of back on their own page. Falls
 * back to the old env-var chain when no request is available (there
 * currently always is one, but this keeps the function usable without one).
 */
export function getSiteUrl(request?: Request): string {
  const host = request?.headers.get("x-forwarded-host") ?? request?.headers.get("host");
  if (host) {
    const proto = request?.headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}
