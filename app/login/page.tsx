"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";

export default function LoginPage() {
  const router = useRouter();
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
            ? "Ton adresse e-mail n'est pas encore confirmée. Vérifie ta boîte mail."
            : signInError.message === "Invalid login credentials"
              ? "Email ou mot de passe incorrect."
              : signInError.message
        );
        setStatus("error");
        return;
      }

      router.replace("/");
      router.refresh();
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
          Tes fiches de révision, ton planning et tes quiz, générés pour toi.
        </p>

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

          <div className="mt-1 flex items-center justify-between">
            <label className="text-sm font-medium" htmlFor="password">
              Mot de passe
            </label>
            <Link href="/forgot-password" prefetch={true} className="text-xs text-text-muted hover:text-accent">
              Mot de passe oublié ?
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
            {status === "sending" ? "Connexion…" : "Se connecter"}
          </Button>
        </form>

        <div className="mt-6 flex items-center gap-3 text-xs text-text-muted">
          <div className="h-px flex-1 bg-border" />
          <span>Pas encore de compte ?</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Link href="/signup" prefetch={true} className="mt-4 block">
          <Button type="button" variant="outline" className="w-full">
            Créer un compte
          </Button>
        </Link>
      </div>
    </div>
  );
}
