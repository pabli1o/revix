import { createClient } from "@/lib/supabase/server";
import { assignSubjectColors, getSubjectColor } from "@/lib/theme/subject-colors";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";

export default async function QuizIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subjects }, { data: chapters }, { data: fiches }] = await Promise.all([
    supabase.from("subjects").select("id, nom").eq("user_id", user!.id).order("nom"),
    supabase.from("chapters").select("id, nom, subject_id").eq("user_id", user!.id).order("nom"),
    supabase.from("fiches").select("id, chapter_id").eq("user_id", user!.id).is("deleted_at", null),
  ]);

  const colors = assignSubjectColors((subjects ?? []).map((s) => s.nom));
  const subjectById = new Map((subjects ?? []).map((s) => [s.id, s]));
  const ficheCountByChapter = new Map<string, number>();
  for (const f of fiches ?? []) {
    ficheCountByChapter.set(f.chapter_id, (ficheCountByChapter.get(f.chapter_id) ?? 0) + 1);
  }

  // Only chapters with at least one fiche can actually be quizzed on.
  const items: TileItem[] = (chapters ?? [])
    .filter((c) => (ficheCountByChapter.get(c.id) ?? 0) > 0)
    .map((c) => {
      const subject = subjectById.get(c.subject_id);
      return {
        id: c.id,
        nom: c.nom,
        count: 0,
        countLabel: subject?.nom ?? "",
        color: subject ? (colors.get(subject.nom) ?? getSubjectColor(subject.nom)) : getSubjectColor(c.nom),
        href: `/quiz/${c.id}`,
        renameUrl: `/api/chapters/${c.id}`,
      };
    });

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-semibold">Quiz</h1>
      <TileGrid
        items={items}
        emptyMessage="Aucun chapitre avec des fiches pour l'instant. Crée d'abord une fiche pour pouvoir te tester dessus."
      />
    </div>
  );
}
