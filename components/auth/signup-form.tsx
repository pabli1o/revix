"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { consumeResumeFicheCreation } from "@/components/fiches/new/resume-flag";
import { applyLocalOnboardingIfPresent } from "@/components/onboarding/apply-local-onboarding";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";

const MIN_PASSWORD_LENGTH = 8;

export function SignupForm({ fromFicheCreation }: { fromFicheCreation: boolean }) {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t.auth.signup.passwordTooShort(MIN_PASSWORD_LENGTH));
      setStatus("error");
      return;
    }
    if (password !== passwordConfirm) {
      setError(t.auth.signup.passwordMismatch);
      setStatus("error");
      return;
    }

    setStatus("sending");

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        // next=/login: the confirmation link proves the email address but
        // shouldn't auto-sign the user in — see /auth/callback, which signs
        // the session back out before redirecting here precisely because
        // the destination is /login.
        options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/login` },
      });

      if (signUpError) {
        setError(
          signUpError.message === "User already registered"
            ? t.auth.signup.emailAlreadyRegistered
            : signUpError.message
        );
        setStatus("error");
        return;
      }

      if (data.session) {
        // Whether signUp() returns an active session or not depends
        // entirely on the Supabase Dashboard's Authentication → Sign In /
        // Providers → Email → "Confirm email" setting — on with "Confirm
        // email", off without it — not on anything in this code, so both
        // branches are kept rather than assuming one. A session here means
        // confirmation is off: apply the onboarding answers stashed
        // locally during the anonymous flow (the normal case for this
        // screen — see app/onboarding/page.tsx's anonymous mode), then
        // resume the pending fiche draft if there is one — or "/" itself,
        // which re-checks onboarding status and falls back to
        // /onboarding (asking again, authenticated) if those answers
        // were somehow missing.
        await applyLocalOnboardingIfPresent();
        const resume = consumeResumeFicheCreation();
        router.replace(resume ? "/fiches/new?resume=1" : "/");
        router.refresh();
        return;
      }

      // No session: confirmation is required by the project's current
      // Supabase settings — show the "check your email" screen below and
      // wait for the link click to land on /auth/callback. The resume flag
      // (if any) stays put in localStorage until a manual login consumes
      // it afterward.
      setStatus("sent");
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.genericError);
      setStatus("error");
    }
  }

  return (
    <div className="notebook-paper flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-card p-8 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-semibold text-accent">Reviix</h1>
          <LanguageSwitcher />
        </div>
        <p className="mt-2 text-sm text-text-muted">
          {fromFicheCreation ? t.auth.signup.subtitleFromFiche : t.auth.signup.subtitleDefault}
        </p>

        {status === "sent" ? (
          <div className="mt-8 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
            <p className="font-medium text-success">{t.auth.signup.sentTitle}</p>
            <p className="mt-1 text-text-muted">{t.auth.signup.sentBody(email)}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <label className="text-sm font-medium" htmlFor="email">
              {t.auth.fields.email}
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t.auth.fields.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="mt-1 text-sm font-medium" htmlFor="password">
              {t.auth.fields.password}
            </label>
            <PasswordInput
              id="password"
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              placeholder={t.auth.fields.minPasswordPlaceholder(MIN_PASSWORD_LENGTH)}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label className="mt-1 text-sm font-medium" htmlFor="password-confirm">
              {t.auth.fields.confirmPassword}
            </label>
            <PasswordInput
              id="password-confirm"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={status === "sending"} className="mt-2">
              {status === "sending" ? t.auth.signup.submitting : t.auth.signup.submit}
            </Button>
          </form>
        )}

        {status !== "sent" && (
          <>
            <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
              <div className="h-px flex-1 bg-border" />
              <span>{t.auth.signup.alreadyAccount}</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Link
              href={fromFicheCreation ? "/login?intent=fiche" : "/login"}
              prefetch={true}
              className="mt-4 block"
            >
              <Button type="button" variant="outline" className="w-full">
                {t.auth.signup.login}
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
