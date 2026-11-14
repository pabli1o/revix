import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo, subscriptionHasFeature } from "@/lib/subscription/gate";
import { AppHeader } from "@/components/layout/app-header";
import { FeatureLocked } from "@/components/abonnement/feature-locked";
import { ExamenView } from "@/components/examen/examen-view";
import type { ExamView } from "@/components/planning/exam-list";
import { getDictionary } from "@/lib/i18n/server";

export default async function ExamenPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();
  const t = await getDictionary();

  // Tier-gated like quiz/planning (see lib/subscription/constants.ts) —
  // the tier0 entry plan excludes it, same as an unsubscribed visitor.
  const subscription = await getSubscriptionInfo(user?.id);
  if (!subscriptionHasFeature(subscription, "examen")) {
    return (
      <div>
        <AppHeader />
        <FeatureLocked feature="examen" currentTier={subscription.tier} isAuthenticated={Boolean(user)} />
      </div>
    );
  }

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
      .select("revision_jours_semaine, revision_minutes_jour, echelle_note, objectif_moyenne")
      .eq("id", userId)
      .single(),
    supabase.from("subjects").select("id, nom").eq("user_id", userId).order("nom"),
    supabase.from("chapters").select("id, nom, subject_id").eq("user_id", userId).order("nom"),
    supabase
      .from("exams")
      .select("id, nom, date, importance, subject_id, coefficient, note_visee, note_obtenue")
      .eq("user_id", userId)
      .order("date"),
    supabase.from("exam_chapters").select("exam_id, chapter_id"),
    supabase.from("fiches").select("chapter_id").eq("user_id", userId).is("deleted_at", null),
  ]);

  const chapterById = new Map((chapters ?? []).map((c) => [c.id, c]));
  const chapterNamesByExam = new Map<string, string[]>();
  for (const ec of examChapters ?? []) {
    if (!chapterNamesByExam.has(ec.exam_id)) chapterNamesByExam.set(ec.exam_id, []);
    const chapterNom = chapterById.get(ec.chapter_id)?.nom;
    if (chapterNom) chapterNamesByExam.get(ec.exam_id)!.push(chapterNom);
  }

  // Content base for the "Objectif de note" wizard's hours estimate (see
  // lib/examen/goal-calc.ts's computeContentBaseHours) — how many
  // non-deleted fiches each subject has, via its chapters.
  const ficheCountBySubject: Record<string, number> = {};
  for (const subject of subjects ?? []) ficheCountBySubject[subject.id] = 0;
  for (const fiche of fiches ?? []) {
    const subjectId = chapterById.get(fiche.chapter_id)?.subject_id;
    if (subjectId && subjectId in ficheCountBySubject) ficheCountBySubject[subjectId] += 1;
  }

  // Coefficient-weighted average of each subject's already-graded exams —
  // pre-fills the wizard's "moyenne actuelle" step when it exists.
  const weightedSumBySubject = new Map<string, number>();
  const weightBySubject = new Map<string, number>();
  for (const exam of exams ?? []) {
    if (!exam.subject_id || exam.note_obtenue == null) continue;
    weightedSumBySubject.set(
      exam.subject_id,
      (weightedSumBySubject.get(exam.subject_id) ?? 0) + exam.note_obtenue * exam.coefficient,
    );
    weightBySubject.set(exam.subject_id, (weightBySubject.get(exam.subject_id) ?? 0) + exam.coefficient);
  }
  const averageBySubject: Record<string, number | null> = {};
  for (const subject of subjects ?? []) {
    const weight = weightBySubject.get(subject.id) ?? 0;
    averageBySubject[subject.id] = weight > 0 ? (weightedSumBySubject.get(subject.id) ?? 0) / weight : null;
  }

  const examViews: ExamView[] = (exams ?? []).map((e) => ({
    id: e.id,
    nom: e.nom,
    date: e.date,
    importance: e.importance,
    chaptersLabel: (chapterNamesByExam.get(e.id) ?? []).join(", ") || t.examen.noChapter,
    coefficient: e.coefficient,
    noteVisee: e.note_visee,
    noteObtenue: e.note_obtenue,
  }));

  return (
    <div>
      <AppHeader />
      <ExamenView
        exams={examViews}
        subjects={subjects ?? []}
        ficheCountBySubject={ficheCountBySubject}
        averageBySubject={averageBySubject}
        gradeScaleOverride={profile?.echelle_note ?? null}
        objectifMoyenne={profile?.objectif_moyenne ?? 10}
        revisionJoursSemaine={profile?.revision_jours_semaine ?? 3}
        revisionMinutesJour={profile?.revision_minutes_jour ?? 45}
      />
    </div>
  );
}
