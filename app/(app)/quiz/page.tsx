import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { getSubscriptionInfo, subscriptionHasFeature } from "@/lib/subscription/gate";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { AppHeader } from "@/components/layout/app-header";
import { FeatureLocked } from "@/components/abonnement/feature-locked";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getDictionary } from "@/lib/i18n/server";

export default async function QuizIndexPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();
  const t = await getDictionary();

  // Previously gated only one level deeper (per-chapter) — elevated here
  // too so the tab itself shows the lock immediately, consistent with
  // examen/planning, instead of a non-subscriber (or anonymous visitor)
  // seeing the normal "crée d'abord une fiche" empty state.
  const subscription = await getSubscriptionInfo(user?.id);
  if (!subscriptionHasFeature(subscription, "quiz")) {
    return (
      <div>
        <AppHeader />
        <FeatureLocked feature="quiz" currentTier={subscription.tier} isAuthenticated={Boolean(user)} />
      </div>
    );
  }

  const userId = user!.id;
  const [{ data: subjects }, { data: chapters }, { data: fiches }] = await Promise.all([
    supabase.from("subjects").select("id, nom").eq("user_id", userId).order("nom"),
    supabase.from("chapters").select("id, subject_id").eq("user_id", userId),
    supabase.from("fiches").select("id, chapter_id").eq("user_id", userId).is("deleted_at", null),
  ]);

  const colors = assignSubjectColors((subjects ?? []).map((s) => s.nom));
  const ficheCountByChapter = new Map<string, number>();
  for (const f of fiches ?? []) {
    ficheCountByChapter.set(f.chapter_id, (ficheCountByChapter.get(f.chapter_id) ?? 0) + 1);
  }
  // Only chapters with at least one fiche can actually be quizzed on.
  const quizzableChapterCountBySubject = new Map<string, number>();
  for (const c of chapters ?? []) {
    if ((ficheCountByChapter.get(c.id) ?? 0) > 0) {
      quizzableChapterCountBySubject.set(c.subject_id, (quizzableChapterCountBySubject.get(c.subject_id) ?? 0) + 1);
    }
  }

  const items: TileItem[] = (subjects ?? [])
    .filter((s) => (quizzableChapterCountBySubject.get(s.id) ?? 0) > 0)
    .map((s) => {
      const count = quizzableChapterCountBySubject.get(s.id) ?? 0;
      return {
        id: s.id,
        nom: s.nom,
        count,
        countLabel: t.quiz.chapterCount(count),
        color: colors.get(s.nom)!,
        href: `/quiz/${s.id}`,
        renameUrl: `/api/subjects/${s.id}`,
      };
    });

  return (
    <div>
      <AppHeader />
      {items.length === 0 ? (
        <Card>
          <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent">
            {t.quiz.testYourself}
          </p>
          <p className="mb-4 text-text-muted">{t.quiz.chooseSubjectThenChapter}</p>
          <EmptyState className="mb-4">{t.quiz.createFicheFirst}</EmptyState>
          <Button className="w-full" disabled>
            {t.quiz.generateQuizButton}
          </Button>
        </Card>
      ) : (
        <>
          <p className="mb-6 text-sm text-text-muted">{t.quiz.clickSubjectForChapters}</p>
          <TileGrid items={items} emptyMessage={t.quiz.noSubjectsWithFiches} />
        </>
      )}
    </div>
  );
}
