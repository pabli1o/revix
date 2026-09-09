import { createClient } from "@/lib/supabase/server";
import { assignSubjectColors, SUBJECT_PALETTE } from "@/lib/theme/subject-colors";
import { PlanningView, type DayTasks } from "@/components/planning/planning-view";
import type { ExamView } from "@/components/planning/exam-list";
import type { PlanningTaskView } from "@/components/planning/task-row";

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function PlanningPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [
    { data: profile },
    { data: subjects },
    { data: chapters },
    { data: exams },
    { data: examChapters },
    { data: fiches },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("revision_jours_semaine, revision_minutes_jour")
      .eq("id", userId)
      .single(),
    supabase.from("subjects").select("id, nom").eq("user_id", userId).order("nom"),
    supabase.from("chapters").select("id, nom, subject_id").eq("user_id", userId).order("nom"),
    supabase.from("exams").select("id, nom, date, importance").eq("user_id", userId).order("date"),
    supabase.from("exam_chapters").select("exam_id, chapter_id"),
    supabase.from("fiches").select("id, chapter_id").eq("user_id", userId).is("deleted_at", null),
  ]);

  const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));
  const chapterById = new Map((chapters ?? []).map((c) => [c.id, c]));
  const colors = assignSubjectColors((subjects ?? []).map((s) => s.nom));

  const ficheIdsByChapter = new Map<string, string[]>();
  for (const f of fiches ?? []) {
    if (!ficheIdsByChapter.has(f.chapter_id)) ficheIdsByChapter.set(f.chapter_id, []);
    ficheIdsByChapter.get(f.chapter_id)!.push(f.id);
  }

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

  const today = new Date().toISOString().slice(0, 10);
  const { data: tasks } = await supabase
    .from("planning_tasks")
    .select("id, chapter_id, date, type, parties, duree_minutes, completed")
    .eq("user_id", userId)
    .gte("date", today)
    .order("date")
    .limit(200);

  const byDate = new Map<string, PlanningTaskView[]>();
  for (const t of tasks ?? []) {
    const chapter = chapterById.get(t.chapter_id);
    const subject = chapter ? subjectById.get(chapter.subject_id) : undefined;
    // One fiche in the chapter -> straight to it; several -> the chapter's
    // fiche list, where the reader can pick the right one. Either way the
    // timer bar on that screen keys off ?planningTask, which is only ever
    // set via this link (never on a normal fiches/ visit).
    const ficheIds = chapter ? (ficheIdsByChapter.get(chapter.id) ?? []) : [];
    const href = chapter
      ? ficheIds.length === 1
        ? `/fiches/${chapter.subject_id}/${chapter.id}/${ficheIds[0]}?planningTask=${t.id}`
        : `/fiches/${chapter.subject_id}/${chapter.id}?planningTask=${t.id}`
      : "/fiches";
    const view: PlanningTaskView = {
      id: t.id,
      type: t.type,
      chapterNom: chapter?.nom ?? "?",
      subjectNom: subject?.nom ?? "?",
      color: (subject && colors.get(subject.nom)) || SUBJECT_PALETTE[0],
      parties: t.parties,
      dureeMinutes: t.duree_minutes,
      completed: t.completed,
      href,
    };
    if (!byDate.has(t.date)) byDate.set(t.date, []);
    byDate.get(t.date)!.push(view);
  }

  const days: DayTasks[] = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayTasks]) => ({
      date,
      label: DAY_LABEL_FORMATTER.format(new Date(date)),
      tasks: dayTasks,
    }));

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-semibold">Planning</h1>
      <PlanningView
        exams={examViews}
        subjects={subjects ?? []}
        chapters={chapters ?? []}
        days={days}
        revisionJoursSemaine={profile?.revision_jours_semaine ?? 4}
        revisionMinutesJour={profile?.revision_minutes_jour ?? 30}
        hasAnyTasks={days.length > 0}
      />
    </div>
  );
}
