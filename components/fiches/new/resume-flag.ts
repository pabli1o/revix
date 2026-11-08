"use client";

/**
 * One-shot marker set right before an anonymous visitor is sent to
 * /signup (or /login) from the public creation screen, so login/signup/
 * onboarding know to send them back to /fiches/new?resume=1 afterward
 * instead of their normal destination (see creation-flow.tsx and the 3
 * call sites that consume this).
 *
 * TTL'd at 1h and always removed on read (valid or not) rather than
 * cleared precisely on abandon — there's no reliable hook for "the user
 * closed the tab without finishing signup". Without a TTL, an abandoned
 * attempt would otherwise silently redirect an unrelated login days later
 * (e.g. just checking their planning) to the fiche screen instead of
 * /fiches — a confusing surprise, not a crash, but still wrong.
 */
const KEY = "reviix:resume-fiche-creation";
const TTL_MS = 60 * 60 * 1000;

export function markResumeFicheCreation(): void {
  try {
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Storage unavailable (private mode, quota) — resume just won't
    // happen; the user can still click "Générer" again after logging in.
  }
}

export function consumeResumeFicheCreation(): boolean {
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.removeItem(KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < TTL_MS;
  } catch {
    return false;
  }
}
