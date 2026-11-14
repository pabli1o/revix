"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { GradeEntryBanner } from "@/components/examen/grade-entry-banner";
import type { GradeScale, Importance } from "@/lib/supabase/database.types";
import { useLocale } from "@/components/i18n/locale-provider";
import { formatDate } from "@/lib/i18n/format";
import { resolveGradeScale, formatGrade } from "@/lib/i18n/grade-scale";

export interface ExamView {
  id: string;
  nom: string;
  date: string;
  importance: Importance;
  chaptersLabel: string;
  coefficient: number;
  /** The "Objectif de note" wizard's goal grade, /20 — null for an exam
   * created before that existed. */
  noteVisee: number | null;
  /** The grade actually obtained, /20 — null = "à venir" (Part B). */
  noteObtenue: number | null;
}

export function ExamList({ exams, gradeScaleOverride }: { exams: ExamView[]; gradeScaleOverride: GradeScale | null }) {
  const router = useRouter();
  const { t, locale } = useLocale();
  const scale = resolveGradeScale(locale, gradeScaleOverride);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const importanceLabel: Record<Importance, string> = {
    normale: t.examen.importance.normale.label,
    importante: t.examen.importance.importante.label,
    tres_importante: t.examen.importance.tresImportante.label,
  };

  async function remove(id: string) {
    if (!window.confirm(t.examen.confirmDeleteExam)) return;
    setBusyId(id);
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
    await fetch("/api/planning/generate", { method: "POST" });
    setBusyId(null);
    router.refresh();
  }

  if (exams.length === 0) {
    return <EmptyState>{t.examen.noExamsYet}</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-3">
      {exams.map((exam) => (
        <Card key={exam.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{exam.nom}</p>
              <p className="text-sm text-text-muted">
                {formatDate(exam.date, locale, { weekday: "long", day: "numeric", month: "long" })} ·{" "}
                {exam.chaptersLabel}
              </p>
              {exam.noteVisee != null && (
                <p className="mt-1 text-sm text-accent">
                  {t.examen.goalBadge(
                    formatGrade(exam.noteVisee, scale, locale),
                    exam.noteObtenue != null ? formatGrade(exam.noteObtenue, scale, locale) : null,
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {exam.coefficient > 1 && <Badge>{t.examen.coefficientBadge(exam.coefficient)}</Badge>}
              <Badge>{importanceLabel[exam.importance]}</Badge>
              {exam.noteObtenue != null && (
                <Button size="sm" variant="secondary" onClick={() => setEditingId(exam.id)}>
                  {t.examen.gradeEntry.editButton}
                </Button>
              )}
              <Button size="sm" variant="danger" disabled={busyId === exam.id} onClick={() => remove(exam.id)}>
                {t.common.delete}
              </Button>
            </div>
          </div>

          {editingId === exam.id && (
            <GradeEntryBanner
              examId={exam.id}
              subjectName={exam.nom}
              noteVisee={exam.noteVisee}
              gradeScaleOverride={gradeScaleOverride}
              initialNoteObtenue={exam.noteObtenue ?? undefined}
              onSaved={() => setEditingId(null)}
            />
          )}
        </Card>
      ))}
    </div>
  );
}
