"use client";

import { useState } from "react";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GradeSlider } from "@/components/examen/grade-slider";
import { useLocale } from "@/components/i18n/locale-provider";
import { resolveGradeScale, formatGrade } from "@/lib/i18n/grade-scale";
import { computeWeightedAverage, computeNeededAverage } from "@/lib/examen/average-calc";
import type { GradeScale } from "@/lib/supabase/database.types";

export interface MoyenneExamRow {
  id: string;
  subjectName: string;
  coefficient: number;
  noteVisee: number | null;
  noteObtenue: number | null;
}

/**
 * Part B, step 2-4: the weighted average, the per-exam breakdown, the
 * editable average goal, and (when relevant) the grade still needed on
 * what's left to hit it — all the pure math comes from
 * lib/examen/average-calc.ts, this component only presents it and PATCHes
 * /api/me when the goal changes.
 */
export function MoyenneBlock({
  exams,
  gradeScaleOverride,
  initialObjectifMoyenne,
  onAddExamWithGoal,
}: {
  exams: MoyenneExamRow[];
  gradeScaleOverride: GradeScale | null;
  initialObjectifMoyenne: number;
  onAddExamWithGoal: (needed20: number) => void;
}) {
  const { t, locale } = useLocale();
  const scale = resolveGradeScale(locale, gradeScaleOverride);

  const [objectifMoyenne, setObjectifMoyenne] = useState(initialObjectifMoyenne);
  const [savedObjectif, setSavedObjectif] = useState(initialObjectifMoyenne);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gradedExams = exams
    .filter((e) => e.noteObtenue != null)
    .map((e) => ({ coefficient: e.coefficient, noteObtenue: e.noteObtenue as number }));
  const remainingCoefficients = exams.filter((e) => e.noteObtenue == null).map((e) => e.coefficient);

  const weightedAverage = computeWeightedAverage(gradedExams);
  const needed =
    weightedAverage != null ? computeNeededAverage(gradedExams, remainingCoefficients, objectifMoyenne) : null;

  async function saveObjectif() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ objectifMoyenne }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t.examen.moyenne.goalSaveError);
      setSaving(false);
      return;
    }
    setSavedObjectif(objectifMoyenne);
    setSaving(false);
  }

  return (
    <Card>
      <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
        {t.examen.moyenne.title}
      </p>

      {weightedAverage != null ? (
        <p className="font-heading text-3xl font-bold text-text">{formatGrade(weightedAverage, scale, locale)}</p>
      ) : (
        <p className="text-sm text-text-muted">{t.examen.moyenne.noGradesYet}</p>
      )}
      <p className="mt-1 text-xs text-text-muted">{t.examen.moyenne.source}</p>

      {exams.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {exams.map((exam) => (
            <div key={exam.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border px-3 py-2">
              <div>
                <p className="text-sm font-medium">{exam.subjectName}</p>
                {exam.noteVisee != null && (
                  <p className="text-xs text-text-muted">
                    {t.examen.goalBadge(
                      formatGrade(exam.noteVisee, scale, locale),
                      exam.noteObtenue != null ? formatGrade(exam.noteObtenue, scale, locale) : null,
                    )}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {exam.coefficient > 1 && <Badge>{t.examen.coefficientBadge(exam.coefficient)}</Badge>}
                {exam.noteObtenue != null ? (
                  <Badge className="border-accent/40 text-accent">{formatGrade(exam.noteObtenue, scale, locale)}</Badge>
                ) : (
                  <Badge>{t.examen.moyenne.upcomingBadge}</Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <label className="mb-2 block text-sm font-medium">{t.examen.moyenne.goalLabel}</label>
        <GradeSlider
          value={objectifMoyenne}
          onChange={setObjectifMoyenne}
          scale={scale}
          locale={locale}
          ariaLabel={t.examen.moyenne.goalLabel}
        />
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <Button
          size="sm"
          variant="secondary"
          className="mt-3"
          onClick={saveObjectif}
          disabled={saving || objectifMoyenne === savedObjectif}
        >
          {saving ? t.examen.moyenne.goalSaving : t.examen.moyenne.goalSaveButton}
        </Button>
      </div>

      {needed && needed.kind !== "no-remaining-exams" && weightedAverage != null && (
        <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-4">
          <p className="text-sm text-text">
            {needed.kind === "normal" &&
              t.examen.moyenne.neededNormal(
                formatGrade(weightedAverage, scale, locale),
                formatGrade(savedObjectif, scale, locale),
                formatGrade(needed.neededAverage20!, scale, locale),
                t.examen.moyenne.remainingExamsLabel(remainingCoefficients.length),
              )}
            {needed.kind === "already-achieved" &&
              t.examen.moyenne.neededAlreadyAchieved(
                formatGrade(weightedAverage, scale, locale),
                formatGrade(savedObjectif, scale, locale),
              )}
            {needed.kind === "out-of-reach" &&
              t.examen.moyenne.neededOutOfReach(
                formatGrade(weightedAverage, scale, locale),
                formatGrade(savedObjectif, scale, locale),
                formatGrade(needed.maxAchievableAverage20!, scale, locale),
              )}
          </p>

          {needed.kind === "normal" && (
            <div className="mt-3">
              <p className="mb-2 text-sm font-medium text-accent">
                {t.examen.moyenne.prefillCta(formatGrade(needed.neededAverage20!, scale, locale))}
              </p>
              <Button size="sm" onClick={() => onAddExamWithGoal(needed.neededAverage20!)}>
                {t.examen.moyenne.prefillButton(formatGrade(needed.neededAverage20!, scale, locale))}
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
