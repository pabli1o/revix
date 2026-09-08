"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ExamForm } from "./exam-form";
import { ExamList, type ExamView } from "./exam-list";
import { SettingsPanel } from "./settings-panel";
import { TaskRow, type PlanningTaskView } from "./task-row";

interface SubjectOption {
  id: string;
  nom: string;
}
interface ChapterOption {
  id: string;
  nom: string;
  subject_id: string;
}

export interface DayTasks {
  date: string;
  label: string;
  tasks: PlanningTaskView[];
}

export function PlanningView({
  exams,
  subjects,
  chapters,
  days,
  revisionJoursSemaine,
  revisionMinutesJour,
  hasAnyTasks,
}: {
  exams: ExamView[];
  subjects: SubjectOption[];
  chapters: ChapterOption[];
  days: DayTasks[];
  revisionJoursSemaine: number;
  revisionMinutesJour: number;
  hasAnyTasks: boolean;
}) {
  const router = useRouter();
  const [showExamForm, setShowExamForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function regenerate() {
    setGenerating(true);
    await fetch("/api/planning/generate", { method: "POST" });
    setGenerating(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Examens</h2>
          <Button size="sm" onClick={() => setShowExamForm((v) => !v)}>
            {showExamForm ? "Fermer" : "+ Ajouter un examen"}
          </Button>
        </div>
        {showExamForm && (
          <Card className="mb-4">
            <ExamForm subjects={subjects} chapters={chapters} onDone={() => setShowExamForm(false)} />
          </Card>
        )}
        <ExamList exams={exams} />
      </div>

      <SettingsPanel initialJours={revisionJoursSemaine} initialMinutes={revisionMinutesJour} />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-xl font-semibold">Ton planning</h2>
          <Button size="sm" variant="secondary" onClick={regenerate} disabled={generating}>
            {generating ? "Génération…" : "🔄 Régénérer"}
          </Button>
        </div>

        {!hasAnyTasks && (
          <p className="text-text-muted">
            Ajoute un examen (avec ses chapitres) pour générer ton planning de révision.
          </p>
        )}

        <div className="flex flex-col gap-6">
          {days.map((day) => (
            <div key={day.date}>
              <h3 className="mb-2 font-mono text-sm uppercase tracking-wide text-text-muted">
                {day.label}
              </h3>
              <div className="flex flex-col gap-2">
                {day.tasks.map((task) => (
                  <TaskRow key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
