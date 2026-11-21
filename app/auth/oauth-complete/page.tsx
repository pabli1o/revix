"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { applyLocalOnboardingIfPresent } from "@/components/onboarding/apply-local-onboarding";
import { consumeResumeFicheCreation } from "@/components/fiches/new/resume-flag";
import { useLocale } from "@/components/i18n/locale-provider";

/**
 * Where /auth/callback sends a Google sign-in once the session is
 * established (see ContinueWithGoogleButton's redirectTo) — email/
 * password's signup-form.tsx and login-form.tsx both apply the stashed
 * local onboarding answers and resume a pending fiche draft synchronously
 * in their own submit handler, but a browser redirect to Google and back
 * never re-runs that handler. This page is the one place that logic
 * still runs for the OAuth path, right after landing back on this origin
 * signed in — then "/" (app/page.tsx) decides /onboarding vs /fiches as
 * usual, so a mid-onboarding Google signup resumes at the next step
 * (moyenne actuelle) with prénom/classe/niveau already saved, and an
 * existing user goes straight into the app.
 */
export default function OAuthCompletePage() {
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    (async () => {
      await applyLocalOnboardingIfPresent();
      const resume = consumeResumeFicheCreation();
      router.replace(resume ? "/fiches/new?resume=1" : "/");
      router.refresh();
    })();
  }, [router]);

  return (
    <div className="notebook-paper flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-card p-8 text-center shadow-xl">
        <h1 className="font-heading text-3xl font-semibold text-accent">Reviix</h1>
        <p className="mt-6 text-sm text-text-muted">{t.auth.oauth.completing}</p>
      </div>
    </div>
  );
}
