"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MIN_PASSWORD_LENGTH = 8;

export default function SignupPage() {
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

      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${siteUrl}/auth/callback` },
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
        <h1 className="font-heading text-3xl font-semibold text-accent">Revix</h1>
        <p className="mt-2 text-sm text-text-muted">Crée ton compte pour commencer.</p>

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
            <Input
              id="password"
              type="password"
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
            <Input
              id="password-confirm"
              type="password"
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

            <p className="mt-1 text-center text-xs text-text-muted">
              Déjà un compte ?{" "}
              <Link href="/login" className="font-medium text-accent hover:underline">
                Connecte-toi
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
