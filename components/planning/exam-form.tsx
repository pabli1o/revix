"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceCard } from "@/components/ui/choice-card";
import { CalendarPicker } from "./calendar-picker";
import type { Importance } from "@/lib/supabase/database.types";
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

export function ExamForm({
  subjects,
  chapters,
  onDone,
}: {
  subjects: SubjectOption[];
  chapters: ChapterOption[];
  onDone: () => void;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [nom, setNom] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [importance, setImportance] = useState<Importance>("normale");
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importanceOptions: { value: Importance; label: string; description: string }[] = [
    { value: "normale", ...t.examen.importance.normale },
    { value: "importante", ...t.examen.importance.importante },
    { value: "tres_importante", ...t.examen.importance.tresImportante },
  ];

  function toggleChapter(id: string) {
    setSelectedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    if (!nom.trim() || !date) {
      setError(t.examen.nameAndDateRequired);
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: nom.trim(),
        date,
        importance,
        chapterIds: Array.from(selectedChapters),
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? t.examen.createExamError);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onDone();
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t.examen.examNameLabel}</label>
        <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder={t.examen.examNamePlaceholder} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t.examen.dateLabel}</label>
        <CalendarPicker value={date} onChange={setDate} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t.examen.importanceLabel}</label>
        <div className="flex flex-col gap-2">
          {importanceOptions.map((opt) => (
            <ChoiceCard
              key={opt.value}
              compact
              title={opt.label}
              description={opt.description}
              selected={importance === opt.value}
              onClick={() => setImportance(opt.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t.examen.chaptersCoveredLabel}</label>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border p-3">
          {subjects.length === 0 && (
            <p className="text-sm text-text-muted">{t.examen.createChaptersFirst}</p>
          )}
          {subjects.map((subject) => {
            const subjectChapters = chapters.filter((c) => c.subject_id === subject.id);
            if (subjectChapters.length === 0) return null;
            return (
              <div key={subject.id} className="mb-3 last:mb-0">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {subject.nom}
                </p>
                <div className="flex flex-col gap-1.5">
                  {subjectChapters.map((c) => (
                    <ChoiceCard
                      key={c.id}
                      compact
                      title={c.nom}
                      selected={selectedChapters.has(c.id)}
                      onClick={() => toggleChapter(c.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? t.examen.creatingExam : t.examen.addExamButton}
      </Button>
    </div>
  );
}
