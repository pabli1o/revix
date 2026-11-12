"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Importance } from "@/lib/supabase/database.types";
import { useLocale } from "@/components/i18n/locale-provider";

export interface ExamView {
  id: string;
  nom: string;
  date: string;
  importance: Importance;
  chaptersLabel: string;
}

// Not locale-parametrized yet — a separate pass handles date/number
// formatting across the app.
const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function ExamList({ exams }: { exams: ExamView[] }) {
  const router = useRouter();
  const { t } = useLocale();
  const [busyId, setBusyId] = useState<string | null>(null);

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
        <Card key={exam.id} className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">{exam.nom}</p>
            <p className="text-sm text-text-muted">
              {DATE_FORMATTER.format(new Date(exam.date))} · {exam.chaptersLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{importanceLabel[exam.importance]}</Badge>
            <Button size="sm" variant="danger" disabled={busyId === exam.id} onClick={() => remove(exam.id)}>
              {t.common.delete}
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
