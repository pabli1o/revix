"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { ContinueWithGoogleButton } from "@/components/auth/continue-with-google-button";
import { consumeResumeFicheCreation } from "@/components/fiches/new/resume-flag";
import { applyLocalOnboardingIfPresent } from "@/components/onboarding/apply-local-onboarding";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";

const MIN_PASSWORD_LENGTH = 8;

export function SignupForm({ fromFicheCreation }: { fromFicheCreation: boolean }) {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [emailConfirm, setEmailConfirm] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Checked without ever copying one field into the other — the two
    // have to be typed (or pasted) independently, that's the whole point
    // of asking twice.
    if (email.trim() !== emailConfirm.trim()) {
      setError(t.auth.signup.emailMismatch);
      setStatus("error");
      return;
    }
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

      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        setError(
          signUpError.message === "User already registered"
            ? t.auth.signup.emailAlreadyRegistered
            : signUpError.message
        );
        setStatus("error");
        return;
      }

      if (!data.session) {
        // Email confirmation is disabled in the Supabase project, so
        // signUp() always returns an active session — this would only
        // happen if that project setting ever changed back. There's no
        // "check your email" screen to fall back to anymore (removed
        // along with the confirmation requirement itself), so this just
        // surfaces a clear error instead of silently going nowhere; the
        // account does exist, and a normal login still works.
        setError(t.auth.signup.noImmediateSessionError);
        setStatus("error");
        return;
      }

      // Apply the onboarding answers stashed locally during the anonymous
      // flow (the normal case for this screen — see app/onboarding/
      // page.tsx's anonymous mode: prénom/classe/niveau, saved right
      // before landing here — see wizard.tsx's handlePrenomContinue),
      // then go straight to the next onboarding step (moyenne actuelle)
      // rather than through "/" — no intermediate screen now that
      // signUp() always returns a session immediately. The one exception
      // is a pending fiche-creation draft (a different entry point,
      // outside the main onboarding flow), which still resumes there.
      await applyLocalOnboardingIfPresent();
      const resume = consumeResumeFicheCreation();
      router.replace(resume ? "/fiches/new?resume=1" : "/onboarding");
      router.refresh();
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

        <div className="mt-8">
          <ContinueWithGoogleButton />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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

          <label className="mt-1 text-sm font-medium" htmlFor="email-confirm">
            {t.auth.fields.confirmEmail}
          </label>
          <Input
            id="email-confirm"
            name="email-confirm"
            type="email"
            required
            autoComplete="off"
            placeholder={t.auth.fields.emailPlaceholder}
            value={emailConfirm}
            onChange={(e) => setEmailConfirm(e.target.value)}
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

        <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
          <div className="h-px flex-1 bg-border" />
          <span>{t.auth.signup.alreadyAccount}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link href={fromFicheCreation ? "/login?intent=fiche" : "/login"} prefetch={true} className="mt-4 block">
          <Button type="button" variant="outline" className="w-full">
            {t.auth.signup.login}
          </Button>
        </Link>
      </div>
    </div>
  );
}
