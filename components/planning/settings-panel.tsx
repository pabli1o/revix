"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const MINUTES_OPTIONS = [15, 20, 30, 45, 60, 75, 90];

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

  async function save(nextJours: number, nextMinutes: number) {
    setSaving(true);
    await fetch("/api/planning/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionJoursSemaine: nextJours, revisionMinutesJour: nextMinutes }),
    });
    await fetch("/api/planning/generate", { method: "POST" });
    setSaving(false);
    router.refresh();
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <label className="text-sm font-medium">Jours de révision par semaine</label>
        <Select
          className="mt-2"
          value={jours}
          disabled={saving}
          onChange={(e) => {
            const next = Number(e.target.value);
            setJours(next);
            save(next, minutes);
          }}
        >
          {DAYS_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d} jour{d > 1 ? "s" : ""}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-sm font-medium">Temps de révision par jour de travail</label>
        <Select
          className="mt-2"
          value={minutes}
          disabled={saving}
          onChange={(e) => {
            const next = Number(e.target.value);
            setMinutes(next);
            save(jours, next);
          }}
        >
          {MINUTES_OPTIONS.map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-text-muted">S&apos;applique à l&apos;ensemble de tes examens.</p>
    </Card>
  );
}
