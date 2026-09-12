import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "./admin";
import { getAuthedUser } from "./auth";

/** Shared tag for every cached profile row. Coarse — invalidating it busts
 * every user's cached profile, not just the one that changed — but simple
 * and safe: profile writes are rare (rename, onboarding), and a dynamic
 * per-user tag can't be expressed with unstable_cache's API without
 * fragile workarounds. A shared invalidation costs one extra DB read for
 * other users' next page load; a missed one risks the bug described
 * below, so simple-and-safe wins here. */
export const PROFILE_CACHE_TAG = "profiles";

/** The actual DB read, cached across requests (not just within one) via
 * unstable_cache — runs on a cache miss on whichever server instance
 * handles the request, using the admin client since unstable_cache's
 * function body can't depend on cookies(). `userId` is a call argument,
 * so it's automatically part of the cache key: different users never
 * share a cache slot, only the invalidation tag is shared. */
const fetchProfileFromDb = unstable_cache(
  async (userId: string) => {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("prenom, nom, onboarding_completed")
      .eq("id", userId)
      .maybeSingle();
    return data;
  },
  ["profile-by-id"],
  {
    tags: [PROFILE_CACHE_TAG],
    // Safety net in case a future profile-writing route forgets to call
    // revalidateTag(PROFILE_CACHE_TAG) — bounds worst-case staleness even
    // then. Tag invalidation (see app/api/me and app/api/onboarding) is
    // what actually keeps this fresh in the normal case.
    revalidate: 300,
  },
);

/**
 * The current user's profile (prenom/nom/onboarding_completed) — cached
 * across requests via unstable_cache, then memoized again per-request via
 * React's cache() so the layout and every page's <AppHeader /> share one
 * call instead of each firing their own query.
 *
 * ⚠️ onboarding_completed gates the /onboarding redirect in
 * app/(app)/layout.tsx. The two places that can flip it —
 * app/api/onboarding/route.ts and app/api/me/route.ts — call
 * revalidateTag(PROFILE_CACHE_TAG) right after writing. If you add another
 * route that writes prenom/nom/onboarding_completed, it MUST do the same,
 * or a user could get bounced back to /onboarding (or see a stale name)
 * for up to the 300s safety-net window above.
 */
export const getProfile = cache(async () => {
  const user = await getAuthedUser();
  if (!user) return null;
  return fetchProfileFromDb(user.id);
});
