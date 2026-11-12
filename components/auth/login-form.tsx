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

export function LoginForm({ fromFicheCreation }: { fromFicheCreation: boolean }) {
  const router = useRouter();
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          signInError.message === "Email not confirmed"
            ? t.auth.login.errorEmailNotConfirmed
            : signInError.message === "Invalid login credentials"
              ? t.auth.login.errorInvalidCredentials
              : signInError.message
        );
        setStatus("error");
        return;
      }

      // Applies any onboarding answers stashed locally during the
      // anonymous flow (no-op if there are none — the common case for a
      // normal returning login). Then resumes the pending fiche draft if
      // one was left — otherwise "/" itself re-checks onboarding status
      // and lands on /onboarding or /fiches as appropriate.
      await applyLocalOnboardingIfPresent();
      const resume = consumeResumeFicheCreation();
      router.replace(resume ? "/fiches/new?resume=1" : "/");
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
          {fromFicheCreation ? t.auth.login.subtitleFromFiche : t.auth.login.subtitleDefault}
        </p>

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

          <div className="mt-1 flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">
              {t.auth.fields.password}
            </label>
            <Link href="/forgot-password" prefetch={true} className="text-xs text-text-muted hover:text-accent">
              {t.auth.login.forgotPassword}
            </Link>
          </div>
          <PasswordInput
            id="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button type="submit" disabled={status === "sending"} className="mt-2">
            {status === "sending" ? t.auth.login.submitting : t.auth.login.submit}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
          <div className="h-px flex-1 bg-border" />
          <span>{t.auth.login.noAccount}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link
          href={fromFicheCreation ? "/signup?intent=fiche" : "/signup"}
          prefetch={true}
          className="mt-4 block"
        >
          <Button type="button" variant="outline" className="w-full">
            {t.auth.login.createAccount}
          </Button>
        </Link>
      </div>
    </div>
  );
}
