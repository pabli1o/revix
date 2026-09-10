import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";

export default async function QuizSubjectPage(props: PageProps<"/quiz/[subjectId]">) {
  const { subjectId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subject }, { data: allSubjects }, { data: chapters }, { data: fiches }, { data: attempts }] =
    await Promise.all([
      supabase.from("subjects").select("id, nom").eq("id", subjectId).eq("user_id", user!.id).maybeSingle(),
      supabase.from("subjects").select("nom").eq("user_id", user!.id),
      supabase.from("chapters").select("id, nom").eq("subject_id", subjectId).eq("user_id", user!.id).order("nom"),
      supabase.from("fiches").select("id, chapter_id").eq("user_id", user!.id).is("deleted_at", null),
      // Most recent first, so the first attempt seen per chapter below is
      // the latest one.
      supabase
        .from("quiz_attempts")
        .select("chapter_id, score, total, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false }),
    ]);

  if (!subject) notFound();

  const color = assignSubjectColors((allSubjects ?? []).map((s) => s.nom)).get(subject.nom)!;
  const ficheCountByChapter = new Map<string, number>();
  for (const f of fiches ?? []) {
    ficheCountByChapter.set(f.chapter_id, (ficheCountByChapter.get(f.chapter_id) ?? 0) + 1);
  }
  const lastAttemptByChapter = new Map<string, { score: number; total: number }>();
  for (const a of attempts ?? []) {
    if (!lastAttemptByChapter.has(a.chapter_id)) {
      lastAttemptByChapter.set(a.chapter_id, { score: a.score, total: a.total });
    }
  }

  // Only chapters with at least one fiche can actually be quizzed on.
  const items: TileItem[] = (chapters ?? [])
    .filter((c) => (ficheCountByChapter.get(c.id) ?? 0) > 0)
    .map((c) => {
      const last = lastAttemptByChapter.get(c.id);
      return {
        id: c.id,
        nom: c.nom,
        count: 0,
        countLabel: last ? `Dernier score : ${last.score}/${last.total}` : "Pas encore tenté",
        color,
        href: `/quiz/chapitre/${c.id}`,
        renameUrl: `/api/chapters/${c.id}`,
      };
    });

  return (
    <div>
      <p className="mb-1 text-sm text-text-muted">
        <Link href="/quiz" className="hover:text-accent">
          Se tester
        </Link>{" "}
        / {subject.nom}
      </p>
      <h1 className="mb-6 font-heading text-3xl font-semibold">{subject.nom}</h1>
      <TileGrid
        items={items}
        emptyMessage="Aucun chapitre avec des fiches pour l'instant dans cette matière."
      />
    </div>
  );
}
