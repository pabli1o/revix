"use client";

import type { ClasseCycle } from "@/lib/supabase/database.types";

/**
 * Keeps the onboarding answers in the browser for a visitor who hasn't
 * signed up yet (see components/onboarding/wizard.tsx's "anonymous"
 * mode) — submitted to /api/onboarding only once a real account exists
 * (components/auth/login-form.tsx / signup-form.tsx), since there's
 * nothing to attach them to before that. localStorage is enough here
 * (a handful of small fields, unlike the fiche draft's files — see
 * components/fiches/new/local-draft.ts, which needs IndexedDB).
 *
 * Signup happens right after the prénom step (see wizard.tsx's
 * handlePrenomContinue), so in practice this only ever holds that trio —
 * everything asked afterward (rhythm, moyennes) is authenticated by then
 * and saved straight to the profile instead. The remaining fields stay
 * optional rather than being removed, so a stale entry saved by an older
 * build of this file (full answer set, saved at the very end) still
 * loads and applies cleanly instead of being silently dropped.
 */
export interface LocalOnboardingAnswers {
  prenom: string;
  classeCycle: ClasseCycle;
  classeNiveau: string;
  revisionJoursSemaine?: number;
  revisionMinutesJour?: number;
  moyenneGeneraleDepart?: number;
  objectifMoyenne?: number;
}

const KEY = "reviix:local-onboarding";

export function saveLocalOnboarding(answers: LocalOnboardingAnswers): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(answers));
  } catch {
    // Storage unavailable (private mode, quota) — the answers simply
    // won't survive the trip to signup; the user can redo them
    // authenticated afterward (see OnboardingWizard's fallback mode).
  }
}

export function loadLocalOnboarding(): LocalOnboardingAnswers | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalOnboardingAnswers) : null;
  } catch {
    return null;
  }
}

export function clearLocalOnboarding(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Not worth surfacing — worst case a stale entry lingers and gets
    // overwritten or ignored next time.
  }
}
