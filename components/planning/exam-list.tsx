"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Badge } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import type { Importance } from "@/lib/supabase/database.types";

export interface ExamView {
  id: string;
  nom: string;
  date: string;
  importance: Importance;
  chaptersLabel: string;
}

const IMPORTANCE_LABEL: Record<Importance, string> = {
  normale: "Normale",
  importante: "Importante",
  tres_importante: "Très importante",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function ExamList({ exams }: { exams: ExamView[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(id: string) {
    if (!window.confirm("Supprimer cet examen et son planning associé ?")) return;
    setBusyId(id);
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
    await fetch("/api/planning/generate", { method: "POST" });
    setBusyId(null);
    router.refresh();
  }

  if (exams.length === 0) {
    return <EmptyState>Aucun examen ajouté pour l&apos;instant.</EmptyState>;
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
            <Badge>{IMPORTANCE_LABEL[exam.importance]}</Badge>
            <Button size="sm" variant="danger" disabled={busyId === exam.id} onClick={() => remove(exam.id)}>
              Supprimer
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
