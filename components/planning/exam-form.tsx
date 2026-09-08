"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarPicker } from "./calendar-picker";
import type { Importance } from "@/lib/supabase/database.types";

const IMPORTANCE_OPTIONS: { value: Importance; label: string }[] = [
  { value: "normale", label: "Normale" },
  { value: "importante", label: "Importante" },
  { value: "tres_importante", label: "Très importante" },
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
        <div className="flex gap-2">
          {IMPORTANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setImportance(opt.value)}
              className={clsx(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                importance === opt.value
                  ? "border-accent bg-accent text-[#191A2E]"
                  : "border-border bg-bg-elevated hover:border-accent",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Chapitres couverts</label>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-3">
          {subjects.length === 0 && (
            <p className="text-sm text-text-muted">Crée d&apos;abord des fiches pour avoir des chapitres.</p>
          )}
          {subjects.map((subject) => {
            const subjectChapters = chapters.filter((c) => c.subject_id === subject.id);
            if (subjectChapters.length === 0) return null;
            return (
              <div key={subject.id} className="mb-2">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                  {subject.nom}
                </p>
                {subjectChapters.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 py-1 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-[#E8A33D]"
                      checked={selectedChapters.has(c.id)}
                      onChange={() => toggleChapter(c.id)}
                    />
                    {c.nom}
                  </label>
                ))}
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
