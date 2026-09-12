import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";

export default async function QuizSubjectPage(props: PageProps<"/quiz/[subjectId]">) {
  const { subjectId } = await props.params;
  const supabase = await createClient();
  const user = await getAuthedUser();

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
      <p className="mb-6 text-sm text-text-muted">
        <Link href="/quiz" className="hover:text-accent">
          Se tester
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text">{subject.nom}</span>
      </p>

      <div className="mb-8 flex items-center gap-4">
        <div
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 font-heading text-2xl font-semibold text-text"
          style={{ backgroundColor: `${color.bg}26`, borderColor: color.border }}
        >
          {subject.nom.slice(0, 2)}
        </div>
        <div>
          <h1 className="font-heading text-3xl font-semibold">{subject.nom}</h1>
          <p className="text-sm text-text-muted">
            {items.length} chapitre{items.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {items.length > 0 && (
        <p className="mb-6 text-sm text-text-muted">📖 Clique sur un chapitre pour lancer un quiz.</p>
      )}

      <TileGrid
        items={items}
        emptyMessage="Aucun chapitre avec des fiches pour l'instant dans cette matière."
      />
    </div>
  );
}
