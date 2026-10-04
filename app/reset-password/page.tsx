"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";

const MIN_PASSWORD_LENGTH = 8;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  // The /auth/callback redirect already exchanged the email link's code
  // for a (recovery) session before landing here — this just confirms it
  // actually took, so a stale/already-used/expired link shows a clear
  // message instead of a form that would fail on submit.
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
      setChecking(false);
    });
  }, []);

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

    setStatus("saving");

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError(updateError.message);
        setStatus("error");
        return;
      }

      setStatus("done");
      setTimeout(() => {
        router.replace("/");
        router.refresh();
      }, 1200);
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
        <h1 className="font-heading text-3xl font-semibold text-accent">Reviix</h1>

        {checking ? (
          <p className="mt-8 text-sm text-text-muted">Vérification du lien…</p>
        ) : !hasSession ? (
          <div className="mt-8">
            <div className="rounded-lg border border-danger/40 bg-danger/10 p-4 text-sm">
              <p className="font-medium text-danger">Ce lien n&apos;est plus valide.</p>
              <p className="mt-1 text-text-muted">
                Il a peut-être déjà été utilisé ou a expiré. Demande un nouveau lien de
                réinitialisation.
              </p>
            </div>
            <Link href="/forgot-password" prefetch={true} className="mt-4 block">
              <Button type="button" variant="outline" className="w-full">
                Demander un nouveau lien
              </Button>
            </Link>
          </div>
        ) : status === "done" ? (
          <div className="mt-8 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
            <p className="font-medium text-success">Mot de passe mis à jour !</p>
            <p className="mt-1 text-text-muted">Redirection…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
            <p className="mb-2 text-sm text-text-muted">Choisis un nouveau mot de passe.</p>
            <label className="text-sm font-medium" htmlFor="password">
              Nouveau mot de passe
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

            <Button type="submit" disabled={status === "saving"} className="mt-2">
              {status === "saving" ? "Enregistrement…" : "Mettre à jour le mot de passe"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
