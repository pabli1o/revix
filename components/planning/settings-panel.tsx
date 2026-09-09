"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DurationSelector } from "@/components/ui/duration-selector";

export function SettingsPanel({
  initialJours,
  initialMinutes,
}: {
  initialJours: number;
  initialMinutes: number;
}) {
  const router = useRouter();
  const [jours, setJours] = useState(initialJours);
  const [minutes, setMinutes] = useState(initialMinutes);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    await fetch("/api/planning/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionJoursSemaine: jours, revisionMinutesJour: minutes }),
    });
    await fetch("/api/planning/generate", { method: "POST" });
    setSaving(false);
    setMessage("Planning régénéré !");
    router.refresh();
  }

  return (
    <Card>
      <h2 className="mb-4 font-heading text-lg font-semibold">Rythme de révision</h2>
      <div className="flex flex-col gap-4">
        <div>
          <label className="text-sm font-medium">
            Jours par semaine : <span className="text-accent">{jours}</span>
          </label>
          <input
            type="range"
            min={1}
            max={7}
            value={jours}
            onChange={(e) => setJours(Number(e.target.value))}
            className="mt-2 w-full accent-[#E8A33D]"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Minutes par jour</label>
          <DurationSelector value={minutes} onChange={setMinutes} className="mt-2" />
        </div>
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? "Régénération…" : "Enregistrer et régénérer le planning"}
        </Button>
        {message && <p className="text-sm text-success">{message}</p>}
      </div>
    </Card>
  );
}
