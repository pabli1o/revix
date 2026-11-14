"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradeSlider } from "@/components/examen/grade-slider";
import { useLocale } from "@/components/i18n/locale-provider";
import { resolveGradeScale, formatGrade } from "@/lib/i18n/grade-scale";
import type { GradeScale } from "@/lib/supabase/database.types";

/** Part B, step 1: shown on the Examen tab for every exam whose date has
 * passed with no grade yet (see lib/examen/average-calc.ts's
 * examGradeStatus) — asks for the grade on the same 0-20 scale as the
 * goal wizard's sliders, then shows the gap vs. the goal that was set. */
export function GradeEntryBanner({
  examId,
  subjectName,
  noteVisee,
  gradeScaleOverride,
  initialNoteObtenue,
  onSaved,
}: {
  examId: string;
  subjectName: string;
  noteVisee: number | null;
  gradeScaleOverride: GradeScale | null;
  /** Set when editing a grade entered earlier (see exam-list.tsx) — absent
   * for the first-time entry banner, which starts from the goal instead. */
  initialNoteObtenue?: number;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const scale = resolveGradeScale(locale, gradeScaleOverride);
  const [noteObtenue, setNoteObtenue] = useState(initialNoteObtenue ?? noteVisee ?? 10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/exams/${examId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noteObtenue }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t.examen.gradeEntry.saveError);
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved?.();
    router.refresh();
  }

  return (
    <Card className="border-accent/40 bg-accent/5">
      <p className="font-medium text-text">{t.examen.gradeEntry.question(subjectName)}</p>

      <div className="mt-4">
        <GradeSlider
          value={noteObtenue}
          onChange={setNoteObtenue}
          scale={scale}
          locale={locale}
          ariaLabel={t.examen.gradeEntry.question(subjectName)}
        />
      </div>

      {noteVisee != null && (
        <p className="mt-3 text-center text-sm text-text-muted">
          {t.examen.gradeEntry.goalGap(formatGrade(noteVisee, scale, locale), formatGrade(noteObtenue, scale, locale))}
        </p>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <Button size="lg" className="mt-4 w-full" onClick={handleSave} disabled={saving}>
        {saving ? t.examen.gradeEntry.savingButton : t.examen.gradeEntry.submitButton}
      </Button>
    </Card>
  );
}
