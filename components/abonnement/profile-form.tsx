"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileForm({
  initialPrenom,
  initialNom,
}: {
  initialPrenom: string;
  initialNom: string;
}) {
  const router = useRouter();
  const [prenom, setPrenom] = useState(initialPrenom);
  const [nom, setNom] = useState(initialNom);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prenom, nom }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? "Impossible d'enregistrer.");
        return;
      }
      setMessage("Profil mis à jour.");
      router.refresh();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-text-muted">Prénom</label>
        <Input value={prenom} onChange={(e) => setPrenom(e.target.value)} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-text-muted">Nom</label>
        <Input value={nom} onChange={(e) => setNom(e.target.value)} />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {message && <p className="text-sm text-success">{message}</p>}
      <Button size="sm" className="self-start" onClick={handleSave} disabled={saving || !prenom.trim()}>
        {saving ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </div>
  );
}
