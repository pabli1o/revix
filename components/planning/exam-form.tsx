"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChoiceCard } from "@/components/ui/choice-card";
import { CalendarPicker } from "./calendar-picker";
import type { Importance } from "@/lib/supabase/database.types";

const IMPORTANCE_OPTIONS: { value: Importance; label: string; description: string }[] = [
  { value: "normale", label: "Normale", description: "Un contrôle comme un autre" },
  { value: "importante", label: "Importante", description: "Compte plus dans la moyenne" },
  { value: "tres_importante", label: "Très importante", description: "Examen décisif, type bac/partiels" },
];

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
  const [nom, setNom] = useState("");
  const [date, setDate] = useState<string | null>(null);
  const [importance, setImportance] = useState<Importance>("normale");
  const [selectedChapters, setSelectedChapters] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError("Nom et date sont requis.");
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
      setError(data?.error ?? "Erreur lors de la création de l'examen.");
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
        <label className="mb-1 block text-sm font-medium">Nom de l&apos;examen</label>
        <Input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex : DS de maths" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Date</label>
        <CalendarPicker value={date} onChange={setDate} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Importance</label>
        <div className="flex flex-col gap-2">
          {IMPORTANCE_OPTIONS.map((opt) => (
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
        <label className="mb-1 block text-sm font-medium">Chapitres couverts</label>
        <div className="max-h-64 overflow-y-auto rounded-lg border border-border p-3">
          {subjects.length === 0 && (
            <p className="text-sm text-text-muted">Crée d&apos;abord des fiches pour avoir des chapitres.</p>
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
        {submitting ? "Création…" : "Ajouter l'examen"}
      </Button>
    </div>
  );
}
