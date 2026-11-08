"use client";

import { loadLocalOnboarding, clearLocalOnboarding } from "./local-onboarding";

/**
 * Called right after a session is established (a fresh signup with an
 * immediate session, or a manual login) — submits any onboarding answers
 * stashed locally during the anonymous flow, so the profile is filled in
 * without re-asking. Returns true only once the POST actually succeeds
 * (and clears the local copy then); false either when there was nothing
 * to apply (a normal returning user — the common case) or the request
 * failed (network, server error) — the local answers are kept in that
 * second case so a retry is still possible.
 *
 * The caller doesn't need to branch on the result to decide where to
 * redirect: navigating to "/" afterward already re-checks
 * profiles.onboarding_completed server-side (see app/page.tsx) and sends
 * the visitor to /onboarding itself if it's still not done — covering
 * both "never did it locally" and "this POST just failed" the same way,
 * without this function having to guess which case it's in.
 */
export async function applyLocalOnboardingIfPresent(): Promise<boolean> {
  const answers = loadLocalOnboarding();
  if (!answers) return false;

  try {
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(answers),
    });
    if (!res.ok) return false;
    clearLocalOnboarding();
    return true;
  } catch {
    return false;
  }
}
