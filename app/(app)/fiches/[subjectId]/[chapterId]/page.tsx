import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { assignSubjectColors } from "@/lib/theme/subject-colors";
import { TileGrid, type TileItem } from "@/components/fiches/tile-grid";
import { Button } from "@/components/ui/button";

const DATE_FORMATTER = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" });

export default async function ChapterPage(props: PageProps<"/fiches/[subjectId]/[chapterId]">) {
  const { subjectId, chapterId } = await props.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subject }, { data: chapter }, { data: allSubjects }, { data: fiches }] =
    await Promise.all([
      supabase.from("subjects").select("id, nom").eq("id", subjectId).eq("user_id", user!.id).maybeSingle(),
      supabase
        .from("chapters")
        .select("id, nom")
        .eq("id", chapterId)
        .eq("user_id", user!.id)
        .maybeSingle(),
      supabase.from("subjects").select("nom").eq("user_id", user!.id),
      supabase
        .from("fiches")
        .select("id, titre, created_at")
        .eq("chapter_id", chapterId)
        .eq("user_id", user!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    ]);

  if (!subject || !chapter) notFound();

  const color = assignSubjectColors((allSubjects ?? []).map((s) => s.nom)).get(subject.nom)!;

  const items: TileItem[] = (fiches ?? []).map((f) => ({
    id: f.id,
    nom: f.titre,
    count: 0,
    countLabel: DATE_FORMATTER.format(new Date(f.created_at)),
    color,
  }));

  return (
    <div>
      <p className="mb-1 text-sm text-text-muted">
        <Link href="/fiches" className="hover:text-accent">
          Mes matières
        </Link>{" "}
        /{" "}
        <Link href={`/fiches/${subjectId}`} className="hover:text-accent">
          {subject.nom}
        </Link>{" "}
        / {chapter.nom}
      </p>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-3xl font-semibold">{chapter.nom}</h1>
        <div className="flex gap-2">
          <Link href={`/quiz/${chapterId}`}>
            <Button variant="secondary">🎯 Lancer un quiz</Button>
          </Link>
          <Link href="/fiches/new">
            <Button>+ Nouvelle fiche</Button>
          </Link>
        </div>
      </div>
      <TileGrid
        items={items}
        hrefFor={(id) => `/fiches/${subjectId}/${chapterId}/${id}`}
        renameEndpoint={(id) => `/api/fiches/${id}`}
        emptyMessage="Aucune fiche dans ce chapitre pour l'instant."
      />
    </div>
  );
}
