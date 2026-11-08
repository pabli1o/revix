"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ChoiceCard } from "@/components/ui/choice-card";

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
    <Card className="flex flex-col gap-6">
      <div>
        <label className="text-sm font-medium">Jours de révision par semaine</label>
        <div className="mt-3 flex flex-col gap-2">
          {DAYS_OPTIONS.map((d) => (
            <ChoiceCard
              key={d}
              compact
              title={`${d} jour${d > 1 ? "s" : ""} par semaine`}
              selected={jours === d}
              disabled={saving}
              onClick={() => {
                setJours(d);
                save(d, minutes);
              }}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">Temps de révision par jour de travail</label>
        <div className="mt-3 flex flex-col gap-2">
          {MINUTES_OPTIONS.map((m) => (
            <ChoiceCard
              key={m}
              compact
              title={`${m} min par jour`}
              selected={minutes === m}
              disabled={saving}
              onClick={() => {
                setMinutes(m);
                save(jours, m);
              }}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-text-muted">S&apos;applique à l&apos;ensemble de tes examens.</p>
    </Card>
  );
}
