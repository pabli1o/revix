import "server-only";

import { cache } from "react";
import { createClient } from "./server";
import { getAuthedUser } from "./auth";

/**
 * The current user's profile (prenom/nom), memoized per request via
 * React's `cache()` — same reasoning as getAuthedUser(): both the layout
 * (sidebar greeting) and every page's <AppHeader /> need `prenom` to
 * personalize their greeting, and without this they'd each fire their own
 * redundant query for the same row within a single request.
 */
export const getProfile = cache(async () => {
  const user = await getAuthedUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("prenom, nom, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();
  return data;
});
