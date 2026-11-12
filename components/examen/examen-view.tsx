"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SettingsModal } from "@/components/planning/settings-modal";
import { ExamForm } from "@/components/planning/exam-form";
import { ExamList, type ExamView } from "@/components/planning/exam-list";
import { useLocale } from "@/components/i18n/locale-provider";

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
  const { t } = useLocale();
  const [showExamForm, setShowExamForm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function generatePlanning() {
    setGenerating(true);
    await fetch("/api/planning/generate", { method: "POST" });
    setGenerating(false);
    router.push("/planning");
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex flex-col items-center gap-2">
        {showExamForm ? (
          <Card className="w-full">
            <ExamForm subjects={subjects} chapters={chapters} onDone={() => setShowExamForm(false)} />
          </Card>
        ) : (
          <>
            <Button size="lg" className="w-full" onClick={() => setShowExamForm(true)}>
              {t.examen.addExam}
            </Button>
            <p className="text-center text-xs text-text-muted">{t.examen.distributionNote}</p>
          </>
        )}

        <Button variant="ghost" size="sm" onClick={() => setSettingsOpen(true)}>
          {t.examen.editRhythm}
        </Button>
      </div>

      <div>
        <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          {t.examen.yourExams}
        </p>
        <ExamList exams={exams} />
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
