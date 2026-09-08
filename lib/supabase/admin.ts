import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { getSupabaseSecretKey, getSupabaseUrl } from "./env";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * Server-only: never import this from a Client Component. Used for the
 * AI lock table, Stripe webhook writes to `subscriptions`, and background
 * work scheduled via `after()` (which runs outside the request's user
 * session cookies).
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(getSupabaseUrl(), getSupabaseSecretKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
