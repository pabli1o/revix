"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsPanel } from "@/components/planning/settings-panel";
import { ExamForm } from "@/components/planning/exam-form";
import { ExamList, type ExamView } from "@/components/planning/exam-list";

interface SubjectOption {
  id: string;
  nom: string;
}
interface ChapterOption {
  id: string;
  nom: string;
  subject_id: string;
}

export function ExamenView({
  exams,
  subjects,
  chapters,
  revisionJoursSemaine,
  revisionMinutesJour,
}: {
  exams: ExamView[];
  subjects: SubjectOption[];
  chapters: ChapterOption[];
  revisionJoursSemaine: number;
  revisionMinutesJour: number;
}) {
  const router = useRouter();
  const [showExamForm, setShowExamForm] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function generatePlanning() {
    setGenerating(true);
    await fetch("/api/planning/generate", { method: "POST" });
    setGenerating(false);
    router.push("/planning");
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <SettingsPanel initialJours={revisionJoursSemaine} initialMinutes={revisionMinutesJour} />

      <div>
        <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          Tes examens
        </p>

        {showExamForm && (
          <Card className="mb-4">
            <ExamForm subjects={subjects} chapters={chapters} onDone={() => setShowExamForm(false)} />
          </Card>
        )}

        <ExamList exams={exams} />

        {!showExamForm && (
          <div className="mt-4 flex flex-col items-start gap-2">
            <Button variant="outline" onClick={() => setShowExamForm(true)}>
              + Ajouter un examen
            </Button>
            <p className="text-xs text-text-muted">
              Chaque examen est réparti dans le temps qui lui reste, en priorisant les fiches les
              plus urgentes et les chapitres pas encore révisés.
            </p>
          </div>
        )}
      </div>

      <div className="sticky bottom-4 mt-2">
        <Button className="w-full" onClick={generatePlanning} disabled={generating}>
          {generating ? "Génération…" : "Générer le planning"}
        </Button>
      </div>
    </div>
  );
}
