"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { IconGoogle } from "@/components/ui/icons";
import { useLocale } from "@/components/i18n/locale-provider";

/**
 * Shown above both the signup and login forms (see the brief: one tester
 * asked for Google sign-in). Needs no anonymous-onboarding wiring of its
 * own — the stashed prénom/classe/niveau (see components/onboarding/
 * local-onboarding.ts) are already in localStorage by the time this
 * button is visible on /signup, and app/auth/oauth-complete/page.tsx
 * applies them once Google redirects back here, same as the email/
 * password path does synchronously in signup-form.tsx.
 *
 * Code-ready regardless of whether Google OAuth is actually configured
 * in Supabase yet — until it is, Supabase just rejects the attempt and
 * this surfaces oauth.genericError instead of redirecting.
 */
export function ContinueWithGoogleButton() {
  const { t } = useLocale();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/auth/oauth-complete` },
      });
      if (oauthError) {
        setError(t.auth.oauth.genericError);
        setLoading(false);
      }
      // No error: the browser is already navigating to Google, nothing
      // left to do here.
    } catch {
      setError(t.auth.oauth.genericError);
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={handleClick}>
        <IconGoogle className="size-5" />
        {t.auth.oauth.continueWithGoogle}
      </Button>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}

      <div className="mt-4 flex items-center gap-3 text-xs text-text-muted">
        <div className="h-px flex-1 bg-border" />
        <span>{t.auth.oauth.orSeparator}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
