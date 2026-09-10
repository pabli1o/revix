import "server-only";

import { cache } from "react";
import { createClient } from "./server";

/**
 * The authenticated user, memoized per request via React's `cache()`.
 *
 * Every layout and page in app/(app)/** independently called
 * `createClient()` + `supabase.auth.getUser()` to get the current user —
 * `getUser()` makes a real network round-trip to Supabase's Auth server
 * (unlike `getSession()`, it re-verifies the JWT rather than just reading
 * the cookie), and the middleware in lib/supabase/middleware.ts already
 * makes that same call once per request to guard the route. Stacking a
 * layout's own call and then each page's own call on top meant up to 3
 * sequential auth round-trips before a single actual data query ran — a
 * real, measurable chunk of the "still feels slow" navigation latency.
 *
 * `cache()` de-duplicates calls with the same arguments within a single
 * server render pass: the layout and the page both call this, but the
 * underlying `getUser()` request only ever fires once per request.
 */
export const getAuthedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});
