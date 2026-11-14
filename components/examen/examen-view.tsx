"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SettingsModal } from "@/components/planning/settings-modal";
import { GoalWizard } from "@/components/examen/goal-wizard";
import { GradeEntryBanner } from "@/components/examen/grade-entry-banner";
import { MoyenneBlock } from "@/components/examen/moyenne-block";
import { ExamList, type ExamView } from "@/components/planning/exam-list";
import { useLocale } from "@/components/i18n/locale-provider";
import type { GradeScale } from "@/lib/supabase/database.types";
import { examGradeStatus } from "@/lib/examen/average-calc";

interface SubjectOption {
  id: string;
  nom: string;
}

export function ExamenView({
  exams,
  subjects,
  ficheCountBySubject,
  averageBySubject,
  gradeScaleOverride,
  objectifMoyenne,
  revisionJoursSemaine,
  revisionMinutesJour,
}: {
  exams: ExamView[];
  subjects: SubjectOption[];
  ficheCountBySubject: Record<string, number>;
  averageBySubject: Record<string, number | null>;
  gradeScaleOverride: GradeScale | null;
  objectifMoyenne: number;
  revisionJoursSemaine: number;
  revisionMinutesJour: number;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [showWizard, setShowWizard] = useState(false);
  const [prefillGoal, setPrefillGoal] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function generatePlanning() {
    setGenerating(true);
    await fetch("/api/planning/generate", { method: "POST" });
    setGenerating(false);
    router.push("/planning");
  }

  function openWizard(goal20: number | null) {
    setPrefillGoal(goal20);
    setShowWizard(true);
  }

  const examsAwaitingGrade = exams.filter((e) => examGradeStatus(e.date, e.noteObtenue) === "awaiting-grade-entry");

  return (
    <div className="flex flex-col gap-6 pb-24">
      {showWizard && (
        <GoalWizard
          subjects={subjects}
          ficheCountBySubject={ficheCountBySubject}
          averageBySubject={averageBySubject}
          gradeScaleOverride={gradeScaleOverride}
          revisionJoursSemaine={revisionJoursSemaine}
          suggestedGoal20={prefillGoal ?? undefined}
          onClose={() => setShowWizard(false)}
        />
      )}

      {examsAwaitingGrade.map((exam) => (
        <GradeEntryBanner
          key={exam.id}
          examId={exam.id}
          subjectName={exam.nom}
          noteVisee={exam.noteVisee}
          gradeScaleOverride={gradeScaleOverride}
        />
      ))}

      <div className="flex flex-col items-center gap-2">
        <Button size="lg" className="w-full" onClick={() => openWizard(null)}>
          {t.examen.addExam}
        </Button>
        <p className="text-center text-xs text-text-muted">{t.examen.distributionNote}</p>

        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
          {t.examen.editRhythm}
        </Button>
      </div>

      {exams.length > 0 && (
        <MoyenneBlock
          exams={exams.map((e) => ({
            id: e.id,
            subjectName: e.nom,
            coefficient: e.coefficient,
            noteVisee: e.noteVisee,
            noteObtenue: e.noteObtenue,
          }))}
          gradeScaleOverride={gradeScaleOverride}
          initialObjectifMoyenne={objectifMoyenne}
          onAddExamWithGoal={(needed20) => openWizard(needed20)}
        />
      )}

      <div>
        <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          {t.examen.yourExams}
        </p>
        <ExamList exams={exams} gradeScaleOverride={gradeScaleOverride} />
      </div>

      <div className="sticky bottom-4 mt-2">
        <Button className="w-full" onClick={generatePlanning} disabled={generating}>
          {generating ? t.examen.generatingPlanning : t.examen.generatePlanning}
        </Button>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialJours={revisionJoursSemaine}
        initialMinutes={revisionMinutesJour}
      />
    </div>
  );
}
