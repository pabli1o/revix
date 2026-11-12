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

const MIN_PASSWORD_LENGTH = 8;

export function SignupForm({ fromFicheCreation }: { fromFicheCreation: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
      setStatus("error");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Les mots de passe ne correspondent pas.");
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
            ? "Un compte existe déjà avec cet e-mail. Connecte-toi plutôt."
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
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur inattendue est survenue. Réessaie dans quelques instants."
      );
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
          {fromFicheCreation
            ? "Crée ton compte pour générer ta fiche."
            : "Crée ton compte pour commencer."}
        </p>

        {status === "sent" ? (
          <div className="mt-8 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
            <p className="font-medium text-success">Vérifie ta boîte mail !</p>
            <p className="mt-1 text-text-muted">
              On a envoyé un lien de confirmation à {email}. Clique dessus (dans ce même
              navigateur) pour activer ton compte.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <label className="text-sm font-medium" htmlFor="email">
              Adresse e-mail
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="prenom@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="mt-1 text-sm font-medium" htmlFor="password">
              Mot de passe
            </label>
            <PasswordInput
              id="password"
              required
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              placeholder="8 caractères minimum"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <label className="mt-1 text-sm font-medium" htmlFor="password-confirm">
              Confirme le mot de passe
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
              {status === "sending" ? "Création…" : "Créer mon compte"}
            </Button>
          </form>
        )}

        {status !== "sent" && (
          <>
            <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
              <div className="h-px flex-1 bg-border" />
              <span>Déjà un compte ?</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Link
              href={fromFicheCreation ? "/login?intent=fiche" : "/login"}
              prefetch={true}
              className="mt-4 block"
            >
              <Button type="button" variant="outline" className="w-full">
                Se connecter
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
