"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useLocale } from "@/components/i18n/locale-provider";
import { SpamNote } from "@/components/auth/spam-note";
import { useResendCooldown } from "@/components/auth/use-resend-cooldown";

export default function ForgotPasswordPage() {
  const { t } = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const resendCooldown = useResendCooldown();

  async function sendResetLink() {
    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    try {
      const { error: resetError } = await sendResetLink();

      if (resetError) {
        setError(resetError.message);
        setStatus("error");
        return;
      }

      setStatus("sent");
      resendCooldown.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.genericError);
      setStatus("error");
    }
  }

  async function handleResend() {
    if (!resendCooldown.canResend || resending) return;
    setResending(true);
    try {
      const { error: resetError } = await sendResetLink();
      if (!resetError) {
        resendCooldown.start();
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="notebook-paper flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-card p-8 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-3xl font-semibold text-accent">Reviix</h1>
          <LanguageSwitcher />
        </div>
        <p className="mt-2 text-sm text-text-muted">{t.auth.forgotPassword.subtitle}</p>

        {status === "sent" ? (
          <div className="mt-8">
            <div className="rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
              <p className="font-medium text-success">{t.auth.forgotPassword.sentTitle}</p>
              <p className="mt-1 text-text-muted">{t.auth.forgotPassword.sentBody(email)}</p>
            </div>
            <SpamNote className="mt-3" />
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              disabled={!resendCooldown.canResend || resending}
              onClick={handleResend}
            >
              {resending
                ? t.auth.emailHelp.resending
                : resendCooldown.canResend
                  ? t.auth.emailHelp.resend
                  : t.auth.emailHelp.resendIn(resendCooldown.secondsLeft)}
            </Button>
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

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={status === "sending"} className="mt-2">
              {status === "sending" ? t.auth.forgotPassword.submitting : t.auth.forgotPassword.submit}
            </Button>
          </form>
        )}

        <Link
          href="/login"
          prefetch={true}
          className="mt-6 block text-center text-sm text-text-muted hover:text-accent"
        >
          ← {t.auth.forgotPassword.backToLogin}
        </Link>
      </div>
    </div>
  );
}
