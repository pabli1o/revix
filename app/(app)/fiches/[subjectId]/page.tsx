import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAuthedUser } from "@/lib/supabase/auth";
import { assignSubjectColors, INK_ON_PALE } from "@/lib/theme/subject-colors";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";

export default async function SubjectPage(props: PageProps<"/fiches/[subjectId]">) {
  const { subjectId } = await props.params;
  const supabase = await createClient();
  const user = await getAuthedUser();

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
      <p className="mb-6 text-sm text-text-muted">
        <Link href="/fiches" className="hover:text-accent">
          Mes matières
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text">{subject.nom}</span>
      </p>

      <div className="mb-8 flex items-center gap-4">
        <div
          aria-hidden
          className="flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 font-heading text-2xl font-semibold"
          style={{ backgroundColor: color.pale, borderColor: color.border, color: INK_ON_PALE }}
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
        <p className="mb-6 text-sm text-text-muted">📖 Clique sur un chapitre pour voir ses fiches.</p>
      )}

      <TileGrid
        items={items}
        emptyMessage="Aucun chapitre pour cette matière pour l'instant."
        allowDelete
        deleteWarning="Supprimer le chapitre « {nom} » ? Toutes ses fiches seront définitivement supprimées (sans passer par la corbeille)."
      />
    </div>
  );
}
