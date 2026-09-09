import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";

export default async function SubjectPage(props: PageProps<"/fiches/[subjectId]">) {
  const { subjectId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subject }, { data: allSubjects }, { data: chapters }, { data: fiches }] =
    await Promise.all([
      supabase.from("subjects").select("id, nom").eq("id", subjectId).eq("user_id", user!.id).maybeSingle(),
      supabase.from("subjects").select("nom").eq("user_id", user!.id),
      supabase
        .from("chapters")
        .select("id, nom")
        .eq("subject_id", subjectId)
        .eq("user_id", user!.id)
        .order("nom"),
      supabase
        .from("fiches")
        .select("id, chapter_id")
        .eq("user_id", user!.id)
        .is("deleted_at", null),
    ]);

  if (!subject) notFound();

  const color = assignSubjectColors((allSubjects ?? []).map((s) => s.nom)).get(subject.nom)!;
  const ficheCountByChapter = new Map<string, number>();
  for (const f of fiches ?? []) {
    ficheCountByChapter.set(f.chapter_id, (ficheCountByChapter.get(f.chapter_id) ?? 0) + 1);
  }

  const items: TileItem[] = (chapters ?? []).map((c) => {
    const count = ficheCountByChapter.get(c.id) ?? 0;
    return {
      id: c.id,
      nom: c.nom,
      count,
      countLabel: `${count} fiche${count !== 1 ? "s" : ""}`,
      color,
      href: `/fiches/${subjectId}/${c.id}`,
      renameUrl: `/api/chapters/${c.id}`,
    };
  });

  return (
    <div>
      <p className="mb-1 text-sm text-text-muted">
        <Link href="/fiches" className="hover:text-accent">
          Mes matières
        </Link>{" "}
        / {subject.nom}
      </p>
      <h1 className="mb-6 font-heading text-3xl font-semibold">{subject.nom}</h1>
      <TileGrid items={items} emptyMessage="Aucun chapitre pour cette matière pour l'instant." />
    </div>
  );
}
