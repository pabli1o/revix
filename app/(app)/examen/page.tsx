import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { ExamenView } from "@/components/examen/examen-view";
import type { ExamView } from "@/components/planning/exam-list";

export default async function ExamenPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: profile }, { data: subjects }, { data: chapters }, { data: exams }, { data: examChapters }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("revision_jours_semaine, revision_minutes_jour")
        .eq("id", userId)
        .single(),
      supabase.from("subjects").select("id, nom").eq("user_id", userId).order("nom"),
      supabase.from("chapters").select("id, nom, subject_id").eq("user_id", userId).order("nom"),
      supabase.from("exams").select("id, nom, date, importance").eq("user_id", userId).order("date"),
      supabase.from("exam_chapters").select("exam_id, chapter_id"),
    ]);

  const chapterById = new Map((chapters ?? []).map((c) => [c.id, c]));
  const chapterNamesByExam = new Map<string, string[]>();
  for (const ec of examChapters ?? []) {
    if (!chapterNamesByExam.has(ec.exam_id)) chapterNamesByExam.set(ec.exam_id, []);
    const chapterNom = chapterById.get(ec.chapter_id)?.nom;
    if (chapterNom) chapterNamesByExam.get(ec.exam_id)!.push(chapterNom);
  }

  const examViews: ExamView[] = (exams ?? []).map((e) => ({
    id: e.id,
    nom: e.nom,
    date: e.date,
    importance: e.importance,
    chaptersLabel: (chapterNamesByExam.get(e.id) ?? []).join(", ") || "Aucun chapitre",
  }));

  return (
    <div>
      <AppHeader />
      <ExamenView
        exams={examViews}
        subjects={subjects ?? []}
        chapters={chapters ?? []}
        revisionJoursSemaine={profile?.revision_jours_semaine ?? 3}
        revisionMinutesJour={profile?.revision_minutes_jour ?? 45}
      />
    </div>
  );
}
