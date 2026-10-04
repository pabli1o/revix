"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    try {
      const supabase = createClient();
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
      });

      if (resetError) {
        setError(resetError.message);
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
        <h1 className="font-heading text-3xl font-semibold text-accent">Reviix</h1>
        <p className="mt-2 text-sm text-text-muted">
          Reçois un lien par e-mail pour choisir un nouveau mot de passe.
        </p>

        {status === "sent" ? (
          <div className="mt-8 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
            <p className="font-medium text-success">Vérifie ta boîte mail !</p>
            <p className="mt-1 text-text-muted">
              Si un compte existe pour {email}, un lien de réinitialisation vient d&apos;être
              envoyé. Clique dessus (dans ce même navigateur) pour choisir un nouveau mot de
              passe.
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

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={status === "sending"} className="mt-2">
              {status === "sending" ? "Envoi…" : "Envoyer le lien"}
            </Button>
          </form>
        )}

        <Link
          href="/login"
          prefetch={true}
          className="mt-6 block text-center text-sm text-text-muted hover:text-accent"
        >
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
