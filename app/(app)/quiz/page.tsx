import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { AppHeader } from "@/components/layout/app-header";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default async function QuizIndexPage() {
  const supabase = await createClient();
  const user = await getAuthedUser();

  const [{ data: subjects }, { data: chapters }, { data: fiches }] = await Promise.all([
    supabase.from("subjects").select("id, nom").eq("user_id", user!.id).order("nom"),
    supabase.from("chapters").select("id, subject_id").eq("user_id", user!.id),
    supabase.from("fiches").select("id, chapter_id").eq("user_id", user!.id).is("deleted_at", null),
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
        countLabel: `${count} chapitre${count !== 1 ? "s" : ""}`,
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
            Se tester
          </p>
          <p className="mb-4 text-text-muted">
            Choisis une matière puis un chapitre : une dizaine de questions sont préparées à partir
            du contenu exact de tes fiches.
          </p>
          <EmptyState className="mb-4">
            Crée d&apos;abord une fiche pour pouvoir te tester dessus.
          </EmptyState>
          <Button className="w-full" disabled>
            Générer le quiz
          </Button>
        </Card>
      ) : (
        <>
          <p className="mb-6 text-sm text-text-muted">
            📚 Clique sur une matière pour voir ses chapitres.
          </p>
          <TileGrid
            items={items}
            emptyMessage="Aucune matière avec des fiches pour l'instant."
          />
        </>
      )}
    </div>
  );
}
