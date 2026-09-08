import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PlanningTaskPartie } from "@/lib/supabase/database.types";
import {
  generatePlanning,
  type SchedulerChapter,
  type SchedulerExam,
} from "./scheduler";

/**
 * Loads everything the scheduler needs for one user — future exams and the
 * chapters they cover, each chapter's content split into "parties" (its
 * fiches' plan sections), and the user's revision rhythm — then runs
 * `generatePlanning` and returns the resulting tasks (not yet persisted).
 */
export async function buildPlanningTasks(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const [{ data: profile }, { data: exams }, { data: fiches }] = await Promise.all([
    supabase
      .from("profiles")
      .select("revision_jours_semaine, revision_minutes_jour")
      .eq("id", userId)
      .single(),
    supabase.from("exams").select("id, date, importance").eq("user_id", userId),
    supabase
      .from("fiches")
      .select("chapter_id, contenu")
      .eq("user_id", userId)
      .is("deleted_at", null),
  ]);

  const examIds = (exams ?? []).map((e) => e.id);
  const { data: examChapters } =
    examIds.length > 0
      ? await supabase.from("exam_chapters").select("exam_id, chapter_id").in("exam_id", examIds)
      : { data: [] };

  const chaptersByExam = new Map<string, string[]>();
  for (const ec of examChapters ?? []) {
    if (!chaptersByExam.has(ec.exam_id)) chaptersByExam.set(ec.exam_id, []);
    chaptersByExam.get(ec.exam_id)!.push(ec.chapter_id);
  }

  const schedulerExams: SchedulerExam[] = (exams ?? []).map((e) => ({
    id: e.id,
    date: e.date,
    importance: e.importance,
    chapterIds: chaptersByExam.get(e.id) ?? [],
  }));

  const partiesByChapter = new Map<string, PlanningTaskPartie[]>();
  for (const fiche of fiches ?? []) {
    if (!partiesByChapter.has(fiche.chapter_id)) partiesByChapter.set(fiche.chapter_id, []);
    const list = partiesByChapter.get(fiche.chapter_id)!;
    for (const section of fiche.contenu.plan) {
      list.push({ numero: list.length + 1, titre: section.titre });
    }
  }

  const chapters = new Map<string, SchedulerChapter>();
  for (const [chapterId, parties] of partiesByChapter) {
    chapters.set(chapterId, { id: chapterId, parties });
  }

  const settings = {
    revisionJoursSemaine: profile?.revision_jours_semaine ?? 4,
    revisionMinutesJour: profile?.revision_minutes_jour ?? 30,
  };

  return generatePlanning(schedulerExams, chapters, settings);
}
