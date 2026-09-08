"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });

    if (signInError) {
      setError(signInError.message);
      setStatus("error");
      return;
    }
    setStatus("sent");
  }

  return (
    <div className="notebook-paper flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-bg-card p-8 shadow-xl">
        <h1 className="font-heading text-3xl font-semibold text-accent">Revix</h1>
        <p className="mt-2 text-sm text-text-muted">
          Tes fiches de révision, ton planning et tes quiz, générés pour toi.
        </p>

        {status === "sent" ? (
          <div className="mt-8 rounded-lg border border-success/40 bg-success/10 p-4 text-sm">
            <p className="font-medium text-success">Lien envoyé !</p>
            <p className="mt-1 text-text-muted">
              Consulte ta boîte mail ({email}) et clique sur le lien de connexion. Ouvre-le dans
              ce même navigateur.
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
              {status === "sending" ? "Envoi en cours…" : "Recevoir un lien de connexion"}
            </Button>
            <p className="mt-1 text-xs text-text-muted">
              Pas de mot de passe : on t&apos;envoie un lien magique par e-mail.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
