"use client";

import { ChoiceCard } from "@/components/ui/choice-card";
import { useLocale } from "@/components/i18n/locale-provider";

const DAYS_OPTIONS = [1, 2, 3, 4, 5, 6, 7];
const MINUTES_OPTIONS = [15, 20, 30, 45, 60, 75, 90];

/**
 * Pure, controlled rhythm picker — no state, no network call of its own.
 * Only ever rendered inside components/planning/settings-modal.tsx, which
 * owns the (jours, minutes) selection and only persists it when its own
 * "Valider" button is pressed.
 */
export function SettingsPanel({
  jours,
  minutes,
  onChangeJours,
  onChangeMinutes,
}: {
  jours: number;
  minutes: number;
  onChangeJours: (value: number) => void;
  onChangeMinutes: (value: number) => void;
}) {
  const { t } = useLocale();
  const p = t.nav.settingsPanel;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label className="text-sm font-medium">{p.daysLabel}</label>
        <div className="mt-3 flex flex-col gap-2">
          {DAYS_OPTIONS.map((d) => (
            <ChoiceCard
              key={d}
              title={p.dayOption(d)}
              selected={jours === d}
              onClick={() => onChangeJours(d)}
            />
          ))}
        </div>
      </div>
      <div>
        <label className="text-sm font-medium">{p.minutesLabel}</label>
        <div className="mt-3 flex flex-col gap-2">
          {MINUTES_OPTIONS.map((m) => (
            <ChoiceCard
              key={m}
              title={p.minuteOption(m)}
              selected={minutes === m}
              onClick={() => onChangeMinutes(m)}
            />
          ))}
        </div>
      </div>
      <p className="text-xs text-text-muted">{p.note}</p>
    </div>
  );
}
