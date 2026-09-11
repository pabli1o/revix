import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { assignSubjectColors, SUBJECT_PALETTE } from "@/lib/theme/subject-colors";
import { AppHeader } from "@/components/layout/app-header";
import { PlanningView, type DayTasks } from "@/components/planning/planning-view";
import type { PlanningTaskView } from "@/components/planning/task-row";

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export default async function PlanningPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();
  const userId = user!.id;

  // `tasks` doesn't actually depend on subjects/chapters/fiches (only the
  // per-task rendering below does, to enrich each row with names/hrefs) —
  // it was previously fetched in its own separate `await` after this
  // Promise.all for readability, but that meant a whole extra sequential
  // network round trip to Supabase on every visit to this page for no
  // reason. Folded into the same batch.
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: subjects }, { data: chapters }, { data: fiches }, { data: tasks }] = await Promise.all([
    supabase.from("subjects").select("id, nom").eq("user_id", userId).order("nom"),
    supabase.from("chapters").select("id, nom, subject_id").eq("user_id", userId).order("nom"),
    supabase.from("fiches").select("id, chapter_id").eq("user_id", userId).is("deleted_at", null),
    supabase
      .from("planning_tasks")
      .select("id, chapter_id, date, type, parties, duree_minutes, completed")
      .eq("user_id", userId)
      .gte("date", today)
      .order("date")
      .limit(200),
  ]);

  const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));
  const chapterById = new Map((chapters ?? []).map((c) => [c.id, c]));
  const colors = assignSubjectColors((subjects ?? []).map((s) => s.nom));

  const ficheIdsByChapter = new Map<string, string[]>();
  for (const f of fiches ?? []) {
    if (!ficheIdsByChapter.has(f.chapter_id)) ficheIdsByChapter.set(f.chapter_id, []);
    ficheIdsByChapter.get(f.chapter_id)!.push(f.id);
  }

  const byDate = new Map<string, PlanningTaskView[]>();
  for (const t of tasks ?? []) {
    const chapter = chapterById.get(t.chapter_id);
    const subject = chapter ? subjectById.get(chapter.subject_id) : undefined;
    // One fiche in the chapter -> straight to it; several -> the chapter's
    // fiche list, where the reader can pick the right one. Either way the
    // timer bar on that screen keys off ?planningTask, which is only ever
    // set via this link (never on a normal fiches/ visit).
    const ficheIds = chapter ? (ficheIdsByChapter.get(chapter.id) ?? []) : [];
    const taskQuery = `planningTask=${t.id}&duree=${t.duree_minutes}`;
    const href = chapter
      ? ficheIds.length === 1
        ? `/fiches/${chapter.subject_id}/${chapter.id}/${ficheIds[0]}?${taskQuery}`
        : `/fiches/${chapter.subject_id}/${chapter.id}?${taskQuery}`
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
      <AppHeader />
      <PlanningView days={days} hasAnyTasks={days.length > 0} />
    </div>
  );
}
